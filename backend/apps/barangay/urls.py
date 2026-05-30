from django.urls import path
from rest_framework import generics
from .models import Barangay
from .serializers import BarangaySerializer

class BarangayListView(generics.ListCreateAPIView):
    queryset = Barangay.objects.all()
    serializer_class = BarangaySerializer

class BarangayDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Barangay.objects.all()
    serializer_class = BarangaySerializer
    lookup_field = 'barangay_id'

urlpatterns = [
    path('barangays/', BarangayListView.as_view(), name='barangay-list'),
    path('barangays/<int:barangay_id>/', BarangayDetailView.as_view(), name='barangay-detail'),
]