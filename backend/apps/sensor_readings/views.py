"""
AGOS - SensorReadingWithFlowView
=================================
Accepts a combined POST from the ESP32 containing:
  - node       (int)
  - water_level (float, in cm)
  - reading_status (str: Normal / Warning / Critical)
  - frame_1 through frame_5 (JPEG image files)

Steps:
  1. Validates all required fields
  2. Runs optical flow across the 5 frames → water_flow_rate (m/s)
  3. Fetches last N readings for this node → computes water level trend
  4. Combines flow rate + trend → computes clog_pct (0-100)
  5. Derives water_flow category (Normal / Slow / Stagnant)
  6. Creates one complete SensorReading with everything filled in
  7. Returns the serialized reading

Add to sensor_readings/views.py and sensor_readings/urls.py.
"""

import cv2
import numpy as np
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import SensorReading
from .serializers import SensorReadingSerializer
from apps.sensor_nodes.models import SensorNode
from apps.users.permissions import IsAdminOrMENRO, IsIoTDevice, IoTDeviceAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class SensorReadingListView(generics.ListCreateAPIView):
    queryset = SensorReading.objects.all().order_by('-timestamp')
    serializer_class = SensorReadingSerializer
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENRO()]
        return [IsIoTDevice()]


class SensorReadingByNodeView(generics.ListAPIView):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAdminOrMENRO]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SensorReading.objects.filter(
            node__node_id=node_id
        ).order_by('-timestamp')
    

# ------------------------------------------------------------------
# Tunable constants — adjust after real-world calibration
# ------------------------------------------------------------------

# Number of past readings to use for water level trend
TREND_WINDOW = 5

# Flow rate thresholds (m/s) for water_flow category
FLOW_NORMAL_MIN = 0.10   # above this = Normal
FLOW_SLOW_MIN   = 0.02   # above this, below Normal = Slow
                          # below FLOW_SLOW_MIN = Stagnant

# clog_pct weights — how much each signal contributes
# These should sum to 1.0
WEIGHT_FLOW  = 0.60   # flow rate is the primary signal
WEIGHT_TREND = 0.40   # water level trend is the secondary signal

# Max expected flow rate for normalization (m/s)
# A canal flowing faster than this is considered 0% clogged
MAX_FLOW_RATE = 1.0

# Max expected water level rise per reading cycle (cm)
# A rise faster than this is considered 100% trend contribution
MAX_TREND_RISE = 5.0

# Number of JPEG frames expected in each burst
FRAME_COUNT = 5


# ------------------------------------------------------------------
# Optical flow calculation
# ------------------------------------------------------------------

def compute_optical_flow(frames_bytes: list[bytes], camera_height_cm: float) -> float | None:
    """
    Given a list of JPEG frame bytes and the camera height above water (cm),
    compute the estimated surface water flow rate in m/s using Lucas-Kanade
    sparse optical flow.

    Returns flow rate in m/s, or None if computation fails.
    """
    if len(frames_bytes) < 2:
        return None

    # Decode first frame to get image dimensions
    first_arr = np.frombuffer(frames_bytes[0], dtype=np.uint8)
    first_frame = cv2.imdecode(first_arr, cv2.IMREAD_GRAYSCALE)
    if first_frame is None:
        return None

    img_height, img_width = first_frame.shape

    # pixels_per_meter: how many pixels correspond to 1 real meter
    # at this camera height.
    # Formula: at height H (meters), field of view covers roughly
    # H * tan(FOV/2) * 2 in each direction.
    # For a typical wide-angle camera at 60° FOV:
    #   horizontal coverage ≈ H * 1.155 meters
    # So 1 pixel ≈ (H * 1.155) / image_width meters
    # We invert to get pixels per meter.
    camera_height_m = camera_height_cm / 100.0
    real_width_m = camera_height_m * 1.155  # approx horizontal coverage
    pixels_per_meter = img_width / real_width_m if real_width_m > 0 else 1000

    # Lucas-Kanade parameters
    lk_params = dict(
        winSize=(21, 21),
        maxLevel=3,
        criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01),
    )

    feature_params = dict(
        maxCorners=200,
        qualityLevel=0.01,
        minDistance=7,
        blockSize=7,
    )

    velocities = []
    prev_gray = first_frame

    for i in range(1, len(frames_bytes)):
        curr_arr = np.frombuffer(frames_bytes[i], dtype=np.uint8)
        curr_gray = cv2.imdecode(curr_arr, cv2.IMREAD_GRAYSCALE)
        if curr_gray is None:
            continue

        # Detect feature points in previous frame
        prev_pts = cv2.goodFeaturesToTrack(prev_gray, mask=None, **feature_params)
        if prev_pts is None or len(prev_pts) == 0:
            prev_gray = curr_gray
            continue

        # Track them in current frame
        curr_pts, status_arr, _ = cv2.calcOpticalFlowPyrLK(
            prev_gray, curr_gray, prev_pts, None, **lk_params
        )

        # Keep only successfully tracked points
        good_prev = prev_pts[status_arr == 1]
        good_curr = curr_pts[status_arr == 1]

        if len(good_prev) == 0:
            prev_gray = curr_gray
            continue

        # Compute pixel displacement magnitudes
        displacements = np.sqrt(
            np.sum((good_curr - good_prev) ** 2, axis=1)
        )

        # Convert pixels/frame to m/s
        # time between frames = FRAME_INTERVAL_MS / 1000 seconds
        frame_interval_s = 0.2  # 200ms between frames
        speeds_m_s = displacements / pixels_per_meter / frame_interval_s

        # Use median to ignore outliers (debris moving faster than water)
        if len(speeds_m_s) > 0:
            velocities.append(float(np.median(speeds_m_s)))

        prev_gray = curr_gray

    if not velocities:
        return None

    # Return the median across all frame pairs
    return float(np.median(velocities))


# ------------------------------------------------------------------
# Water level trend calculation
# ------------------------------------------------------------------

def compute_trend_contribution(node, current_water_level: float) -> float:
    """
    Look at the last TREND_WINDOW readings for this node and compute
    how much the water level is rising (0.0 = stable/falling, 1.0 = rising fast).

    Returns a float between 0.0 and 1.0.
    """
    recent = SensorReading.objects.filter(
        node=node
    ).order_by('-timestamp')[:TREND_WINDOW]

    if not recent:
        return 0.0

    levels = [r.water_level for r in recent]

    # Add current reading to the front
    levels = [current_water_level] + levels

    if len(levels) < 2:
        return 0.0

    # Net rise = current level - oldest level in window
    net_rise = levels[0] - levels[-1]

    if net_rise <= 0:
        return 0.0  # stable or falling = no clog contribution from trend

    # Normalize against MAX_TREND_RISE
    return min(net_rise / MAX_TREND_RISE, 1.0)


# ------------------------------------------------------------------
# clog_pct computation
# ------------------------------------------------------------------

def compute_clog_pct(flow_rate: float | None, trend_contribution: float) -> float:
    """
    Combine flow rate and water level trend into a 0-100 clog percentage.

    Flow rate contribution: slow flow = high clog signal.
    Trend contribution: rising water = high clog signal.
    """
    # Flow rate contribution (inverted — slow flow = high clog)
    if flow_rate is None:
        flow_contribution = 0.5  # unknown flow → neutral contribution
    else:
        normalized_flow = min(flow_rate / MAX_FLOW_RATE, 1.0)
        flow_contribution = 1.0 - normalized_flow  # invert: slow = high

    clog = (WEIGHT_FLOW * flow_contribution) + (WEIGHT_TREND * trend_contribution)
    return round(min(clog * 100, 100.0), 2)


# ------------------------------------------------------------------
# water_flow category
# ------------------------------------------------------------------

def get_water_flow_category(flow_rate: float | None) -> str:
    if flow_rate is None:
        return 'Normal'
    if flow_rate >= FLOW_NORMAL_MIN:
        return 'Normal'
    if flow_rate >= FLOW_SLOW_MIN:
        return 'Slow'
    return 'Stagnant'


# ------------------------------------------------------------------
# The view
# ------------------------------------------------------------------

class SensorReadingWithFlowView(APIView):
    """
    Combined sensor reading endpoint.
    Accepts water level + camera burst frames in one multipart POST.
    Computes optical flow and clog_pct, saves one complete SensorReading.

    POST /api/sensor-readings/with-flow/
    Content-Type: multipart/form-data

    Fields:
      node           (int)       required
      water_level    (float, cm) required
      reading_status (str)       required: Normal / Warning / Critical
      frame_1        (file)      required: JPEG
      frame_2        (file)      required: JPEG
      frame_3        (file)      required: JPEG
      frame_4        (file)      required: JPEG
      frame_5        (file)      required: JPEG
    """
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]
    permission_classes = [IsIoTDevice | IsAdminOrMENRO]

    def post(self, request):
        # --- Validate required text fields ---
        node_id        = request.data.get('node')
        water_level    = request.data.get('water_level')
        reading_status = request.data.get('reading_status', 'Normal')

        if not node_id:
            return Response({'error': 'node is required'}, status=status.HTTP_400_BAD_REQUEST)
        if water_level is None:
            return Response({'error': 'water_level is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            water_level = float(water_level)
        except (ValueError, TypeError):
            return Response({'error': 'water_level must be a number'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response({'error': 'Sensor node not found'}, status=status.HTTP_404_NOT_FOUND)

        # --- Collect frame files ---
        frames_bytes = []
        for i in range(1, FRAME_COUNT + 1):
            frame_file = request.FILES.get(f'frame_{i}')
            if frame_file is None:
                return Response(
                    {'error': f'frame_{i} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            frames_bytes.append(frame_file.read())

        # --- Compute camera height above water ---
        # sensor_height is stored on the hotspot (cm from mount to canal floor)
        # camera_height_above_water = sensor_height - water_level
        camera_height_cm = None
        if node.hotspot and node.hotspot.sensor_height:
            camera_height_cm = node.hotspot.sensor_height - water_level
            # Sanity check — if water is above the sensor, something is wrong
            if camera_height_cm <= 0:
                camera_height_cm = 50.0  # fallback: assume 50cm above water

        if camera_height_cm is None:
            # No sensor_height configured yet — use a safe default
            camera_height_cm = 100.0

        # --- Optical flow ---
        water_flow_rate = compute_optical_flow(frames_bytes, camera_height_cm)

        # --- Water level trend ---
        trend_contribution = compute_trend_contribution(node, water_level)

        # --- clog_pct ---
        clog_pct = compute_clog_pct(water_flow_rate, trend_contribution)

        # --- water_flow category ---
        water_flow = get_water_flow_category(water_flow_rate)

        # --- Create SensorReading ---
        reading = SensorReading.objects.create(
            node=node,
            water_level=water_level,
            water_flow_rate=water_flow_rate,
            water_flow=water_flow,
            reading_status=reading_status,
            clog_pct=clog_pct,
        )

        return Response(
            SensorReadingSerializer(reading).data,
            status=status.HTTP_201_CREATED
        )