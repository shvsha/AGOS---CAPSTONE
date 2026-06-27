from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import SensorNode, SystemHealthLog
from .serializers import SensorNodeSerializer, SystemHealthLogSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENRO, IsAdminOrMENROOrBarangay, IsIoTDevice, IoTDeviceAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class SensorNodeListView(generics.ListCreateAPIView):
    serializer_class = SensorNodeSerializer

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
        serializer.save(availability_status='Available')


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
            serializer.save(availability_status=availability_status)
        else:
            serializer.save()


class SensorNodeByBarangayView(generics.ListAPIView):
    serializer_class = SensorNodeSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return SensorNode.objects.filter(barangay__barangay_id=barangay_id)


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

        return Response({'message': f'Node {node_id} has been retired'}, status=status.HTTP_200_OK)


class SystemHealthLogListView(generics.ListCreateAPIView):
    queryset = SystemHealthLog.objects.all().order_by('-checked_at')
    serializer_class = SystemHealthLogSerializer
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENRO()]
        return [IsIoTDevice()]


class SystemHealthLogByNodeView(generics.ListAPIView):
    serializer_class = SystemHealthLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SystemHealthLog.objects.filter(node__node_id=node_id).order_by('-checked_at')