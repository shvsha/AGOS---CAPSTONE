from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import ClogEvent
from .serializers import ClogEventSerializer
from django.utils import timezone

class ClogEventListView(generics.ListCreateAPIView):
    queryset = ClogEvent.objects.all().order_by('-detected_at')
    serializer_class = ClogEventSerializer

class ClogEventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClogEvent.objects.all()
    serializer_class = ClogEventSerializer
    lookup_field = 'event_id'

class ClogEventByBarangayView(generics.ListAPIView):
    serializer_class = ClogEventSerializer

    def get_queryset(self):
        barangay_id = self.kwargs['barangay_id']
        return ClogEvent.objects.filter(barangay__barangay_id=barangay_id).order_by('-detected_at')

class UpdateClogStatusView(APIView):
    def patch(self, request, event_id):
        try:
            event = ClogEvent.objects.get(event_id=event_id)
            new_status = request.data.get('status')

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
