from django.shortcuts import render
from rest_framework import generics
from .models import SensorReading
from .serializers import SensorReadingSerializer

class SensorReadingListView(generics.ListCreateAPIView):
    queryset = SensorReading.objects.all().order_by('-timestamp')
    serializer_class = SensorReadingSerializer

class SensorReadingByNodeView(generics.ListAPIView):
    serializer_class = SensorReadingSerializer

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SensorReading.objects.filter(node__node_id=node_id).order_by('-timestamp')