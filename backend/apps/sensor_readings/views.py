from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import SensorReading
from .serializers import SensorReadingSerializer
from apps.users.permissions import IsAdminOrMENRO

class SensorReadingListView(generics.ListCreateAPIView):
    queryset = SensorReading.objects.all().order_by('-timestamp')
    serializer_class = SensorReadingSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENRO()]
        # POST is for Arduino — allow any authenticated
        return [IsAuthenticated()]

class SensorReadingByNodeView(generics.ListAPIView):
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAdminOrMENRO]

    def get_queryset(self):
        node_id = self.kwargs['node_id']
        return SensorReading.objects.filter(node__node_id=node_id).order_by('-timestamp')