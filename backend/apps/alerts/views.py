from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Alert, AlertRead
from .serializers import AlertSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = []

    def get_queryset(self):
        user = self.request.user
        qs = Alert.objects.all().order_by('-timestamp')
        
        if user.user_role == 'Barangay':
            qs = qs.filter(node__barangay=user.barangay)

        # barangay filter
        barangay_id = self.request.query_params.get('barangay')
        if barangay_id:
            qs = qs.filter(node__barangay__barangay_id=barangay_id)

        # alert type filter
        alert_type = self.request.query_params.get('alert_type')
        if alert_type:
            types = [t.strip() for t in alert_type.split(',')]
            qs = qs.filter(alert_type__in=types)

        # date filter
        date_filter = self.request.query_params.get('date')
        if date_filter == 'Today':
            qs = qs.filter(timestamp__date=timezone.now().date())
        elif date_filter == '7Days':
            qs = qs.filter(timestamp__gte=timezone.now() - timedelta(days=7))
        elif date_filter == '30Days':
            qs = qs.filter(timestamp__gte=timezone.now() - timedelta(days=30))

        return qs
    

class AlertMarkReadView(APIView):
    permission_classes = [IsAdminOrMENROOrBarangay]

    def post(self, request, alert_id):
        try:
            alert = Alert.objects.get(alert_id=alert_id)
        except Alert.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        AlertRead.objects.get_or_create(alert=alert, user=request.user)
        return Response({'detail': 'Marked as read.'})


class AlertUnreadCountView(APIView):
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get(self, request):
        user = request.user
        if user.user_role == 'Barangay':
            queryset = Alert.objects.filter(node__barangay=user.barangay)
        else:
            queryset = Alert.objects.all()

        unread = queryset.exclude(reads__user=user).count()
        return Response({'unread_count': unread})