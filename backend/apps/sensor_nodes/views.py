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


class SystemHealthLogListView(generics.ListCreateAPIView):
    queryset = SystemHealthLog.objects.all().order_by('-checked_at')
    serializer_class = SystemHealthLogSerializer
    authentication_classes = [IoTDeviceAuthentication, JWTAuthentication]
    
    # def get_permissions(self):
    #     if self.request.method == 'GET':
    #             return [IsAdmin()]
    #     return [IsIoTDevice()]

    # after (temp for testing)
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [IsAdmin()]  # temp


class SystemHealthLogByNodeView(generics.ListAPIView):
    serializer_class = SystemHealthLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SystemHealthLog.objects.filter(
            node__node_id=node_id
        ).order_by('-checked_at')