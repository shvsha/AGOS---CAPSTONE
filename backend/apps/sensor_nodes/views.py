import re
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SensorNode, SystemHealthLog
from .serializers import SensorNodeSerializer, SystemHealthLogSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENRO, IsAdminOrMENROOrBarangay, IsIoTDevice, IoTDeviceAuthentication
from apps.users.authentication import CookieJWTAuthentication
from apps.rainfall.services import get_effective_condition, AlertThreshold
from apps.audit_logs.utils import log_action
import secrets
from django.contrib.auth.hashers import make_password


class SensorNodeListView(generics.ListCreateAPIView):
    serializer_class = SensorNodeSerializer
    pagination_class = None

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAdmin()]

    def get_queryset(self):
        qs = SensorNode.objects.all()

        if self.request.user.user_role == 'Barangay':
            qs = qs.filter(barangay=self.request.user.barangay)

        availability_status = self.request.query_params.get('availability_status')
        if availability_status:
            qs = qs.filter(availability_status=availability_status)

        node_status = self.request.query_params.get('node_status')
        if node_status:
            qs = qs.filter(status=node_status)

        return qs

    def perform_create(self, serializer):
        # On create from Node Management: no hotspot or barangay yet, just node_name
        node = serializer.save(availability_status='Available')
        log_action(
            user=self.request.user,
            action='Added Node',
            affected_table='tbl_sensor_nodes',
            new_value=f"node: {node.node_name}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class SensorNodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SensorNode.objects.all()
    serializer_class = SensorNodeSerializer
    lookup_field = 'node_id'
    permission_classes = [IsAdmin]

    def perform_update(self, serializer):
        instance = self.get_object()
        hotspot = serializer.validated_data.get('hotspot', instance.hotspot)

        # If hotspot is being set, mark Occupied; if being cleared, mark Available
        if 'hotspot' in serializer.validated_data:
            availability_status = 'Occupied' if hotspot else 'Available'
            node = serializer.save(availability_status=availability_status)
            log_action(
                user=self.request.user,
                action='Assigned Node' if hotspot else 'Unassigned Node',
                affected_table='tbl_sensor_nodes',
                old_value=f"hotspot: {instance.hotspot.name if instance.hotspot else '—'}",
                new_value=f"hotspot: {hotspot.name if hotspot else '—'}",
                ip_address=self.request.META.get('REMOTE_ADDR')
            )
        else:
            node = serializer.save()
            log_action(
                user=self.request.user,
                action='Updated Node',
                affected_table='tbl_sensor_nodes',
                new_value=f"node: {node.node_name}",
                ip_address=self.request.META.get('REMOTE_ADDR')
            )

class SensorNodeByBarangayView(generics.ListAPIView):
    serializer_class = SensorNodeSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return SensorNode.objects.filter(barangay__barangay_id=barangay_id)


class SensorNodeNextCodeView(APIView):
    """
    Suggests the next available SN- code based on the highest existing
    numeric code, e.g. if SN-5 is the highest, suggests "6".
    Non-numeric codes (e.g. SN-A1) are ignored. Retired nodes still count,
    since their node_name stays reserved (no exclusion in the uniqueness check).
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        highest = 0
        for name in SensorNode.objects.values_list('node_name', flat=True):
            match = re.match(r'^SN-(\d+)$', name or '')
            if match:
                highest = max(highest, int(match.group(1)))

        return Response({'next_code': str(highest + 1)}, status=status.HTTP_200_OK)


class SensorNodeUnassignView(APIView):
    """
    Detach a node from its hotspot and barangay.
    Reverts availability_status to Available.
    """
    permission_classes = [IsAdmin]

    def post(self, request, node_id):
        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response({'error': 'Node not found'}, status=status.HTTP_404_NOT_FOUND)

        if node.availability_status == 'Available':
            return Response({'error': 'Node is already unassigned'}, status=status.HTTP_400_BAD_REQUEST)

        if node.availability_status == 'Retired':
            return Response({'error': 'Retired nodes cannot be unassigned'}, status=status.HTTP_400_BAD_REQUEST)

        node.hotspot = None
        node.barangay = None
        node.availability_status = 'Available'
        node.status = 'Active'
        node.save()

        log_action(
            user=request.user,
            action='Unassigned Node',
            affected_table='tbl_sensor_nodes',
            old_value=f"node: {node.node_name}",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(
            {'message': f'Node {node_id} has been unassigned and is now available'},
            status=status.HTTP_200_OK
        )


class SensorNodeRetireView(APIView):
    """
    Permanently retire a node. Hidden from UI but data preserved.
    """
    permission_classes = [IsAdmin]

    def post(self, request, node_id):
        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response({'error': 'Node not found'}, status=status.HTTP_404_NOT_FOUND)

        if node.availability_status == 'Retired':
            return Response({'error': 'Node is already retired'}, status=status.HTTP_400_BAD_REQUEST)

        node.hotspot = None
        node.barangay = None
        node.availability_status = 'Retired'
        node.save()

        log_action(
            user=request.user,
            action='Retired Node',
            affected_table='tbl_sensor_nodes',
            old_value=f"node: {node.node_name}",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({'message': f'Node {node_id} has been retired'}, status=status.HTTP_200_OK)


class SensorNodeGenerateKeyView(APIView):
    """
    Generates a new device credential for a node. The plaintext key is
    returned ONLY in this response — it's never stored or recoverable
    again, only the hash. Calling this again for the same node
    invalidates whatever key it had before.
    """
    permission_classes = [IsAdmin]

    def post(self, request, node_id):
        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response({'error': 'Node not found'}, status=status.HTTP_404_NOT_FOUND)

        secret = secrets.token_urlsafe(32)
        node.device_key_hash = make_password(secret)
        node.save()

        log_action(
            user=request.user,
            action='Generated Device Key',
            affected_table='tbl_sensor_nodes',
            new_value=f"node: {node.node_name or node.node_id}",
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'node_id': node.node_id,
            'device_key': f"{node.node_id}.{secret}",
            'warning': 'This key will not be shown again. Copy it into the device firmware now.',
        }, status=status.HTTP_200_OK)


class SensorNodeConfigView(APIView):
    """
    Lightweight config endpoint for IoT devices.

    Given a node_id, returns just what a physical sensor node needs to
    configure itself at boot — currently the sensor_height stored on the
    linked hotspot. This lets one physical board be reassigned to a
    different logical node (e.g. during testing/demo) by changing which
    node_id it reports, with no firmware re-flash required — the board
    always fetches the correct sensor height for whichever node_id it's
    currently set to.
    """
    authentication_classes = [IoTDeviceAuthentication, CookieJWTAuthentication]
    permission_classes = [IsIoTDevice | IsAdminOrMENROOrBarangay]

    def get(self, request, node_id):
        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response({'error': 'Sensor node not found'}, status=status.HTTP_404_NOT_FOUND)

        if node.availability_status == 'Retired':
            return Response({'error': 'Node is retired'}, status=status.HTTP_400_BAD_REQUEST)

        sensor_height = node.hotspot.sensor_height if node.hotspot else None
        canal_depth = node.hotspot.canal_depth if node.hotspot else None

        reading_interval_seconds = 300
        if node.barangay:
            condition = get_effective_condition(node.barangay)
            try:
                reading_interval_seconds = AlertThreshold.objects.get(condition=condition).reading_interval_seconds
            except AlertThreshold.DoesNotExist:
                pass

        return Response({
            'node_id': node.node_id,
            'node_name': node.node_name,
            'hotspot_id': node.hotspot.hotspot_id if node.hotspot else None,
            'hotspot_name': node.hotspot.name if node.hotspot else None,
            'sensor_height': sensor_height,
            'canal_depth': canal_depth,
            'reading_interval_seconds': reading_interval_seconds,
            'availability_status': node.availability_status,
            'status': node.status,
        }, status=status.HTTP_200_OK)


class SystemHealthLogListView(generics.ListCreateAPIView):
    pagination_class = None
    serializer_class = SystemHealthLogSerializer
    authentication_classes = [IoTDeviceAuthentication, CookieJWTAuthentication]

    def get_queryset(self):
        from django.utils import timezone
        now = timezone.now()
        return SystemHealthLog.objects.select_related(
            'node', 'node__barangay', 'node__hotspot'
        ).filter(
            timestamp__year=now.year, timestamp__month=now.month
        ).order_by('-checked_at')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENRO()]
        return [IsIoTDevice()]

    def perform_create(self, serializer):
        if isinstance(self.request.auth, SensorNode):
            serializer.save(node=self.request.auth)
        else:
            serializer.save()


class SystemHealthLogByNodeView(generics.ListAPIView):
    serializer_class = SystemHealthLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SystemHealthLog.objects.filter(node__node_id=node_id).order_by('-checked_at')