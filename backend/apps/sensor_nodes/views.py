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
        user = self.request.user
        # Barangay only sees nodes in their jurisdiction
        if user.user_role == 'Barangay':
            return SensorNode.objects.filter(
                barangay=user.barangay
            )
        return SensorNode.objects.all()


class SensorNodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SensorNode.objects.all()
    serializer_class = SensorNodeSerializer
    lookup_field = 'node_id'
    permission_classes = [IsAdmin]


class SensorNodeByBarangayView(generics.ListAPIView):
    serializer_class = SensorNodeSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return SensorNode.objects.filter(barangay__barangay_id=barangay_id)


class SensorNodeDecommissionView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, node_id):
        try:
            node = SensorNode.objects.get(node_id=node_id)
        except SensorNode.DoesNotExist:
            return Response(
                {'error': 'Node not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if node.status == 'Decommissioned':
            return Response(
                {'error': 'Node is already decommissioned'},
                status=status.HTTP_400_BAD_REQUEST
            )

        node.status = 'Decommissioned'
        node.save()

        return Response(
            {'message': f'Node {node_id} has been decommissioned'},
            status=status.HTTP_200_OK
        )

class SystemHealthLogListView(generics.ListCreateAPIView):
    queryset = SystemHealthLog.objects.all().order_by('-checked_at')
    serializer_class = SystemHealthLogSerializer
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [IsIoTDevice()]


class SystemHealthLogByNodeView(generics.ListAPIView):
    serializer_class = SystemHealthLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SystemHealthLog.objects.filter(
            node__node_id=node_id
        ).order_by('-checked_at')
    
