from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Alert
from .serializers import AlertSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay
from django_filters.rest_framework import DjangoFilterBackend

class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['alert_type']

    def get_queryset(self):
        return Alert.objects.filter(
            user=self.request.user
        ).order_by('-timestamp')

class AllAlertsView(generics.ListAPIView):
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer
    permission_classes = [IsAdmin]