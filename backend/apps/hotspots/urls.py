from django.urls import path
from .views import ( HotspotListView, HotspotDetailView, HotspotByBarangayView, HotspotAvailableByBarangayView, )

urlpatterns = [
    path('hotspots/', HotspotListView.as_view(), name='hotspot-list'),
    path('hotspots/<int:hotspot_id>/', HotspotDetailView.as_view(), name='hotspot-detail'),
    path('hotspots/barangay/<int:barangay_id>/', HotspotByBarangayView.as_view(), name='hotspot-by-barangay'),
    path('hotspots/barangay/<int:barangay_id>/available/', HotspotAvailableByBarangayView.as_view(), name='hotspot-available-by-barangay'),
]
