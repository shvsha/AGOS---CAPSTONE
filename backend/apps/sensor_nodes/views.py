from django.shortcuts import render
from rest_framework import generics, permissions
from .models import SensorNode, SystemHealthLog
from .serializers import SensorNodeSerializer, SystemHealthLogSerializer

class SensorNodeListView(generics.ListCreateAPIView):
    queryset = SensorNode.objects.all()
    serializer_class = SensorNodeSerializer

class SensorNodeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SensorNode.objects.all()
    serializer_class = SensorNodeSerializer
    lookup_field = 'node_id'

class SensorNodeByBarangayView(generics.ListAPIView):
    serializer_class = SensorNodeSerializer

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return SensorNode.objects.filter(barangay__barangay_id=barangay_id)

class SystemHealthLogListView(generics.ListCreateAPIView):
    queryset = SystemHealthLog.objects.all().order_by('-checked_at')
    serializer_class = SystemHealthLogSerializer

class SystemHealthLogByNodeView(generics.ListAPIView):
    serializer_class = SystemHealthLogSerializer

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SystemHealthLog.objects.filter(node__node_id=node_id).order_by('-checked_at')
