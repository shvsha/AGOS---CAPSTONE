from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Alert, AlertRead
from .serializers import AlertSerializer
from apps.users.permissions import IsAdmin, IsAdminOrMENROOrBarangay
from django_filters.rest_framework import DjangoFilterBackend

class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['alert_type']

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return Alert.objects.filter(
                node__barangay=user.barangay
            ).order_by('-timestamp')
        # Admin and MENRO see all
        return Alert.objects.all().order_by('-timestamp')
    

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