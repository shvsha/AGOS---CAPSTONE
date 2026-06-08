from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Barangay
from .serializers import BarangaySerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay

class BarangayListView(generics.ListCreateAPIView):
    queryset = Barangay.objects.all()
    serializer_class = BarangaySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAdmin()]

class BarangayDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Barangay.objects.all()
    serializer_class = BarangaySerializer
    lookup_field = 'barangay_id'
    permission_classes = [IsAdmin]