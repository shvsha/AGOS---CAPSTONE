from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
from .serializers import ( BarangayMonthlyReportSerializer, ReportMediaSerializer, MunicipalMonthlyReportSerializer )
from apps.users.permissions import IsAdmin, IsAdminOrMENRO, IsBarangay, IsAdminOrMENROOrBarangay, IsAdminOrMENROOfficer 
from apps.audit_logs.utils import log_action
from django_filters.rest_framework import DjangoFilterBackend


class BarangayMonthlyReportListView(generics.ListCreateAPIView):
    serializer_class = BarangayMonthlyReportSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'report_month', 'barangay']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBarangay()]
        return [IsAdminOrMENROOrBarangay()]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return BarangayMonthlyReport.objects.filter(
                barangay=user.barangay
            ).order_by('-submitted_at')
        return BarangayMonthlyReport.objects.all().order_by('-submitted_at')
    
    def perform_create(self, serializer):
        report = serializer.save()
        log_action(
            user=self.request.user,
            action='Submitted Barangay Monthly Report',
            affected_table='tbl_barangay_monthly_report',
            new_value=f"barangay: {report.barangay.barangay_name}, month: {report.report_month}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class BarangayMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BarangayMonthlyReport.objects.all()
    serializer_class = BarangayMonthlyReportSerializer
    lookup_field = 'monthly_report_id'
    permission_classes = [IsAdminOrMENROOfficer  ]


class ReportMediaListView(generics.ListAPIView):
    queryset = ReportMedia.objects.all()
    serializer_class = ReportMediaSerializer
    permission_classes = [IsAdminOrMENROOfficer ]


class ReportMediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminOrMENROOrBarangay]

    def post(self, request):
        file = request.FILES.get('file')
        media_type = request.data.get('media_type')
        media_category = request.data.get('media_category', 'Sensor_Detection')
        clog_event_id = request.data.get('clog_event_id')
        monthly_report_id = request.data.get('monthly_report_id')

        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not media_type:
            if file.content_type.startswith('image'):
                media_type = 'Image'
            elif file.content_type.startswith('video'):
                media_type = 'Video'
            else:
                return Response(
                    {'error': 'Invalid file type'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        media = ReportMedia(file=file, media_type=media_type, media_category=media_category, uploaded_by=request.user)

        if clog_event_id:
            from apps.clog_events.models import ClogEvent
            try:
                media.clog_event_id = ClogEvent.objects.get(event_id=clog_event_id)
            except ClogEvent.DoesNotExist:
                pass

        if monthly_report_id:
            try:
                media.monthly_report = BarangayMonthlyReport.objects.get(
                    monthly_report_id=monthly_report_id
                )
            except BarangayMonthlyReport.DoesNotExist:
                pass

        media.save()
        return Response(
            ReportMediaSerializer(media, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    

class ReportMediaByClogEventView(generics.ListAPIView):
    serializer_class = ReportMediaSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        event_id = self.kwargs['event_id']
        return ReportMedia.objects.filter(clog_event_id=event_id)


class MunicipalMonthlyReportListView(generics.ListAPIView):
    queryset = MunicipalMonthlyReport.objects.all().order_by('-generated_at')
    serializer_class = MunicipalMonthlyReportSerializer
    permission_classes = [IsAdminOrMENROOfficer ]

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        report = serializer.save()
        log_action(
            user=self.request.user,
            action='Updated Municipal Report Status',
            affected_table='tbl_municipal_monthly_report',
            old_value=old_status,
            new_value=report.status,
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class MunicipalMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MunicipalMonthlyReport.objects.all()
    serializer_class = MunicipalMonthlyReportSerializer
    lookup_field = 'municipal_report_id'
    permission_classes = [IsAdminOrMENROOfficer ]