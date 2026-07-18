import cv2
import numpy as np
import os
import sys
from rest_framework import generics
from rest_framework.views import APIView
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


# Tunable constants

TREND_WINDOW    = 5
FLOW_NORMAL_MIN = 0.10
FLOW_SLOW_MIN   = 0.02
WEIGHT_FLOW     = 0.60
WEIGHT_TREND    = 0.40
MAX_FLOW_RATE   = 1.0
MAX_TREND_RISE  = 5.0
FRAME_COUNT     = 5

# clog_pct threshold to trigger waste classification
CLASSIFY_THRESHOLD = 30.0


# Optical flow

def compute_optical_flow(frames_bytes: list, camera_height_cm: float):
    if len(frames_bytes) < 2:
        return None

    first_arr = np.frombuffer(frames_bytes[0], dtype=np.uint8)
    first_frame = cv2.imdecode(first_arr, cv2.IMREAD_GRAYSCALE)
    if first_frame is None:
        return None

    img_height, img_width = first_frame.shape
    camera_height_m = camera_height_cm / 100.0
    real_width_m = camera_height_m * 1.155
    pixels_per_meter = img_width / real_width_m if real_width_m > 0 else 1000

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

        prev_pts = cv2.goodFeaturesToTrack(prev_gray, mask=None, **feature_params)
        if prev_pts is None or len(prev_pts) == 0:
            prev_gray = curr_gray
            continue

        curr_pts, status_arr, _ = cv2.calcOpticalFlowPyrLK(
            prev_gray, curr_gray, prev_pts, None, **lk_params
        )

        good_prev = prev_pts[status_arr == 1]
        good_curr = curr_pts[status_arr == 1]

        if len(good_prev) == 0:
            prev_gray = curr_gray
            continue

        displacements = np.sqrt(np.sum((good_curr - good_prev) ** 2, axis=1))
        frame_interval_s = 0.2
        speeds_m_s = displacements / pixels_per_meter / frame_interval_s

        if len(speeds_m_s) > 0:
            velocities.append(float(np.median(speeds_m_s)))

        prev_gray = curr_gray

    if not velocities:
        return None

    return float(np.median(velocities))


# ------------------------------------------------------------------
# Water level trend
# ------------------------------------------------------------------

def compute_trend_contribution(node, current_water_level: float) -> float:
    recent = SensorReading.objects.filter(
        node=node
    ).order_by('-timestamp')[:TREND_WINDOW]

    if not recent:
        return 0.0

    levels = [current_water_level] + [r.water_level for r in recent]

    if len(levels) < 2:
        return 0.0

    net_rise = levels[0] - levels[-1]
    if net_rise <= 0:
        return 0.0

    return min(net_rise / MAX_TREND_RISE, 1.0)


# ------------------------------------------------------------------
# clog_pct
# ------------------------------------------------------------------

def compute_clog_pct(flow_rate, trend_contribution: float) -> float:
    if flow_rate is None:
        flow_contribution = 0.5
    else:
        normalized_flow = min(flow_rate / MAX_FLOW_RATE, 1.0)
        flow_contribution = 1.0 - normalized_flow

    clog = (WEIGHT_FLOW * flow_contribution) + (WEIGHT_TREND * trend_contribution)
    return round(min(clog * 100, 100.0), 2)


# ------------------------------------------------------------------
# water_flow category
# ------------------------------------------------------------------

def get_water_flow_category(flow_rate) -> str:
    if flow_rate is None:
        return 'Normal'
    if flow_rate >= FLOW_NORMAL_MIN:
        return 'Normal'
    if flow_rate >= FLOW_SLOW_MIN:
        return 'Slow'
    return 'Stagnant'


# ------------------------------------------------------------------
# AI waste classification
# ------------------------------------------------------------------

def run_waste_classification(image_bytes: bytes):
    try:
        ai_model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
            'ai_model'
        )
        if ai_model_path not in sys.path:
            sys.path.append(ai_model_path)

        from classifier import classify_mixed_from_bytes
        result = classify_mixed_from_bytes(image_bytes)

        if not result.get('success'):
            return None

        return result

    except Exception as e:
        print(f"[WARN] Waste classification failed: {e}")
        return None


# ------------------------------------------------------------------
# Combined view
# ------------------------------------------------------------------

class SensorReadingWithFlowView(APIView):
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]
    permission_classes = [IsIoTDevice | IsAdminOrMENRO]

    def post(self, request):
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
        
        if not node.hotspot:
            return Response(
                {'error': 'Sensor node has no assigned hotspot — cannot classify reading'},
                status=status.HTTP_400_BAD_REQUEST
            )

        canal_depth = node.hotspot.canal_depth
        if not canal_depth or canal_depth <= 0:
            return Response(
                {'error': 'Hotspot has no valid canal_depth set — cannot classify reading'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not node.barangay:
            return Response(
                {'error': 'Sensor node has no assigned barangay — cannot classify reading'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.rainfall.services import classify_water_level

        classification = classify_water_level(
            water_level=water_level,
            canal_depth=canal_depth,
            barangay=node.barangay,
        )
        reading_status = classification['status']

        frames_bytes = []
        for i in range(1, FRAME_COUNT + 1):
            frame_file = request.FILES.get(f'frame_{i}')
            if frame_file is None:
                return Response(
                    {'error': f'frame_{i} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            frames_bytes.append(frame_file.read())

        camera_height_cm = None
        if node.hotspot and node.hotspot.sensor_height:
            camera_height_cm = node.hotspot.sensor_height - water_level
            if camera_height_cm <= 0:
                camera_height_cm = 50.0
        if camera_height_cm is None:
            camera_height_cm = 100.0

        water_flow_rate    = compute_optical_flow(frames_bytes, camera_height_cm)
        trend_contribution = compute_trend_contribution(node, water_level)
        clog_pct           = compute_clog_pct(water_flow_rate, trend_contribution)
        water_flow         = get_water_flow_category(water_flow_rate)

        reading = SensorReading.objects.create(
            node=node,
            water_level=water_level,
            water_flow_rate=water_flow_rate,
            water_flow=water_flow,
            reading_status=reading_status,
            clog_pct=clog_pct,
        )

        if clog_pct >= CLASSIFY_THRESHOLD:
            self._handle_clog_classification(
                node=node,
                reading=reading,
                frame_bytes=frames_bytes[0],
                clog_pct=clog_pct,
            )

        return Response(
            SensorReadingSerializer(reading).data,
            status=status.HTTP_201_CREATED
        )

    def _handle_clog_classification(self, node, reading, frame_bytes, clog_pct):
        from apps.waste_classification.models import WasteClassification
        from apps.clog_events.models import ClogEvent
        from apps.alerts.models import Alert
        from django.utils import timezone
        from datetime import timedelta
        from apps.sensor_readings.signals import get_clog_severity
        from apps.waste_classification.utils import estimate_weight_kg
        from apps.waste_classification.detection import estimate_weight_from_detection
        severity = get_clog_severity(clog_pct)

        classification_result = run_waste_classification(frame_bytes)
        print(f"[DEBUG] classification_result: {classification_result}")  # ← add this
        if classification_result is None:
            print(f"[WARN] Classification failed for reading {reading.reading_id}")
            return

        percentages = classification_result.get('percentages', {})
        print(f"[DEBUG] percentages: {percentages}")  # ← add this
        dominant    = classification_result.get('dominant_waste_type', 'None')
        confidence  = classification_result.get('confidence', 0)
        is_mixed    = classification_result.get('is_mixed', False)
        present     = classification_result.get('present_waste_types', [])

        dominant_label = dominant.replace('_', ' ').title()

        hotspot = node.hotspot if node else None

        # Prefer the item-count-based estimate (YOLO) once a trained model
        # exists. Until then, estimate_weight_from_detection returns
        # (None, None) and we transparently fall back to the existing
        # geometry-based formula — dominant_label/MobileNetV2 output is
        # unaffected either way, only the weight number's source changes.
        detected_kg, detected_counts = estimate_weight_from_detection(frame_bytes)
        if detected_kg is not None:
            estimated_kg = detected_kg
            print(f"[DEBUG] estimated_kg from detection: {estimated_kg} counts={detected_counts}")
        else:
            estimated_kg = estimate_weight_kg(
                canal_width=hotspot.canal_width if hotspot else None,
                sensor_height=hotspot.sensor_height if hotspot else None,
                water_level=reading.water_level,
                clog_pct=clog_pct,
                waste_type=dominant_label,
            )
            estimated_kg = estimated_kg if estimated_kg is not None else 0.0

        classification = WasteClassification.objects.create(
            node=node,
            reading=reading,
            dominant_waste_type=dominant_label,
            recyclable_pct=percentages.get('recyclable', 0),
            biodegradable_pct=percentages.get('biodegradable', 0),
            residual_pct=percentages.get('residual', 0),
            special_waste_pct=percentages.get('special_waste', 0),
            none_pct=percentages.get('none', 0),
            confidence=confidence,
            is_mixed=is_mixed,
            present_waste_types=present,
            estimated_volume=estimated_kg,
        )

        # Only act on the FIRST classification per ClogEvent
        open_event = ClogEvent.objects.filter(
            node=node,
            status__in=['Detected', 'Responded'],
        ).order_by('-detected_at').first()

        if open_event and open_event.classification is None:
            # Link this classification to the ClogEvent
            open_event.classification = classification
            open_event.save()

            # Alert creation itself now lives in clog_events/signals.py
            # (initial fire) and sensor_readings/signals.py (6-hour
            # re-alert while unresolved). Here we just patch the context
            # of the alert(s) tied to this event with the classification
            # data, since alert_context was empty at creation time.
            Alert.objects.filter(event=open_event).update(
                alert_context={
                    'dominant_waste_type': dominant_label,
                    'recyclable_pct':      round(percentages.get('recyclable', 0), 2),
                    'biodegradable_pct':   round(percentages.get('biodegradable', 0), 2),
                    'residual_pct':        round(percentages.get('residual', 0), 2),
                    'special_waste_pct':   round(percentages.get('special_waste', 0), 2),
                    'confidence':          round(confidence, 2),
                    'estimated_volume':    round(estimated_kg, 2),
                }
            )
        # If classification is already linked, do nothing — alert already exists