from django.urls import path
from .views import BarangayListView, BarangayDetailView, BarangayAllView, BarangayUnregisterView, BarangayCheckView

urlpatterns = [
    path('barangays/', BarangayListView.as_view(), name='barangay-list'),
    path('barangays/all/', BarangayAllView.as_view(), name='barangay-all'),
    path('barangays/<int:barangay_id>/', BarangayDetailView.as_view(), name='barangay-detail'),
    path('barangays/<int:barangay_id>/unregister/', BarangayUnregisterView.as_view(), name='barangay-unregister'),
    path('barangays/<int:barangay_id>/check/', BarangayCheckView.as_view(), name='barangay-check'),
]