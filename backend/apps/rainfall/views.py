from rest_framework import generics
from apps.users.permissions import IsAdminOrMENROOrBarangay
from .models import RainfallCondition
from .serializers import RainfallConditionSerializer


class MyBarangayRainfallConditionView(generics.RetrieveAPIView):
    serializer_class = RainfallConditionSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_object(self):
        barangay = self.request.user.barangay
        obj, _ = RainfallCondition.objects.get_or_create(barangay=barangay)
        return obj