from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ClogEvent
from .serializers import ClogEventSerializer
from django.utils import timezone
from apps.users.permissions import IsAdmin, IsAdminOrMENRO, IsAdminOrMENROOrBarangay

class ClogEventListView(generics.ListCreateAPIView):
    serializer_class = ClogEventSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdminOrMENROOrBarangay()]
        return [IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return ClogEvent.objects.filter(
                barangay=user.barangay
            ).order_by('-detected_at')
        return ClogEvent.objects.all().order_by('-detected_at')

class ClogEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClogEvent.objects.all()
    serializer_class = ClogEventSerializer
    lookup_field = 'event_id'
    permission_classes = [IsAdminOrMENRO]

class ClogEventByBarangayView(generics.ListAPIView):
    serializer_class = ClogEventSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return ClogEvent.objects.filter(
            barangay__barangay_id=barangay_id
        ).order_by('-detected_at')

class UpdateClogStatusView(APIView):
    permission_classes = [IsAdminOrMENROOrBarangay]

    def patch(self, request, event_id):
        try:
            event = ClogEvent.objects.get(event_id=event_id)
            new_status = request.data.get('status')
            user = request.user

            # Role-based status restrictions
            if user.user_role == 'Barangay' and new_status not in ['Responded', 'Cleared']:
                return Response(
                    {'error': 'Barangay can only set Responded or Cleared'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if user.user_role == 'MENRO' and new_status not in ['Verified']:
                return Response(
                    {'error': 'MENRO can only set Verified'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if new_status not in ['Detected', 'Responded', 'Cleared', 'Verified']:
                return Response(
                    {'error': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            event.status = new_status
            if new_status == 'Cleared':
                event.resolved_at = timezone.now()
            event.save()

            return Response(ClogEventSerializer(event).data)
        except ClogEvent.DoesNotExist:
            return Response(
                {'error': 'Clog event not found'},
                status=status.HTTP_404_NOT_FOUND
            )