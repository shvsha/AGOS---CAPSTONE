from django.urls import path
from .views import BarangayListView, BarangayDetailView

urlpatterns = [
    path('barangays/', BarangayListView.as_view(), name='barangay-list'),
    path('barangays/<int:barangay_id>/', BarangayDetailView.as_view(), name='barangay-detail'),
]