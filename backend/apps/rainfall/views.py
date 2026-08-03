from rest_framework import generics
from apps.users.permissions import IsAdminOrMENROOrBarangay
from .models import RainfallCondition
from .serializers import RainfallConditionSerializer
from .services import get_effective_condition
from rest_framework.views import APIView
from rest_framework.response import Response


class MyBarangayRainfallConditionView(APIView):
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get(self, request):
        barangay = request.user.barangay
        condition = get_effective_condition(barangay)
        return Response({'condition': condition})