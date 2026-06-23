from rest_framework import generics
from rest_framework.response import Response
from .models import Hotspot
from .serializers import HotspotSerializer
from apps.users.permissions import IsAdmin, IsMENRO, IsAdminOrMENRO, IsAdminOrMENROOrBarangay


class HotspotListView(generics.ListCreateAPIView):
    serializer_class = HotspotSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENRO()]
        return [IsAdminOrMENRO()]

    def get_queryset(self):
        return Hotspot.objects.select_related('barangay').all().order_by('barangay__barangay_name', 'name')


class HotspotDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hotspot.objects.select_related('barangay').all()
    serializer_class = HotspotSerializer
    lookup_field = 'hotspot_id'
    permission_classes = [IsMENRO]


class HotspotByBarangayView(generics.ListAPIView):
    """
    All hotspots under a specific barangay (occupied + available).
    Used for the hotspot management list filtered by barangay.
    """
    serializer_class = HotspotSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return Hotspot.objects.select_related('barangay').filter(
            barangay__barangay_id=barangay_id
        ).order_by('name')


class HotspotAvailableByBarangayView(generics.ListAPIView):
    serializer_class = HotspotSerializer
    permission_classes = [IsMENRO]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        # Exclude hotspots that already have an active/inactive/maintenance node
        occupied_ids = [
            h.hotspot_id
            for h in Hotspot.objects.filter(barangay__barangay_id=barangay_id)
            if h.is_occupied
        ]
        return Hotspot.objects.select_related('barangay').filter(
            barangay__barangay_id=barangay_id
        ).exclude(hotspot_id__in=occupied_ids).order_by('name')
