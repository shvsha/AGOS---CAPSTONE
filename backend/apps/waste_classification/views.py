from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import WasteClassification
from .serializers import WasteClassificationSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay

class WasteClassificationListView(generics.ListCreateAPIView):
    serializer_class = WasteClassificationSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return WasteClassification.objects.filter(
                node__barangay=user.barangay
            ).order_by('-timestamp')
        return WasteClassification.objects.all().order_by('-timestamp')

class WasteClassificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WasteClassification.objects.all()
    serializer_class = WasteClassificationSerializer
    lookup_field = 'classification_id'
    permission_classes = [IsAdmin]