from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
from .serializers import ( BarangayMonthlyReportSerializer, ReportMediaSerializer, MunicipalMonthlyReportSerializer )
from apps.users.permissions import IsAdmin, IsAdminOrMENRO, IsBarangay, IsAdminOrMENROOrBarangay, IsAdminOrMENROOfficer, CanAccessOwnBarangayReport, CanAccessOwnBarangayReportMedia
from apps.audit_logs.utils import log_action
from django_filters.rest_framework import DjangoFilterBackend
from .services import sync_municipal_report


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
        return BarangayMonthlyReport.objects.exclude(status='Draft').order_by('-submitted_at')
    
    def perform_create(self, serializer):
        report = serializer.save(
            barangay=self.request.user.barangay,
            submitted_by=self.request.user,
            status=self.request.data.get('status', 'Pending'),
        )
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
    permission_classes = [CanAccessOwnBarangayReport]

    def perform_update(self, serializer):
        report = serializer.save()
        if report.status == 'Reviewed':
            sync_municipal_report(report.report_month, generated_by=self.request.user)


class MyBarangayReportView(APIView):
    """
    GET /api/barangay-reports/mine/?report_month=YYYY-MM-DD
    Returns the current Barangay user's report for that month, or 404 if none exists yet.
    Barangay-only — scoped to request.user.barangay, no barangay param needed/trusted.
    """
    permission_classes = [IsBarangay]

    def get(self, request):
        report_month = request.query_params.get('report_month')
        if not report_month:
            return Response({'error': 'report_month is required'}, status=status.HTTP_400_BAD_REQUEST)

        report = BarangayMonthlyReport.objects.filter(
            barangay=request.user.barangay,
            report_month=report_month,
        ).first()

        if not report:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            BarangayMonthlyReportSerializer(report, context={'request': request}).data
        )


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

        media = ReportMedia(file_path=file, media_type=media_type, media_category=media_category, uploaded_by=request.user)

        if clog_event_id:
            from apps.clog_events.models import ClogEvent
            try:
                media.clog_event_id = ClogEvent.objects.get(event_id=clog_event_id)
            except ClogEvent.DoesNotExist:
                pass

        if monthly_report_id:
            try:
                report = BarangayMonthlyReport.objects.get(monthly_report_id=monthly_report_id)
                if request.user.user_role == 'Barangay' and report.barangay_id != request.user.barangay_id:
                    return Response({'error': 'Not your report.'}, status=status.HTTP_403_FORBIDDEN)
                media.monthly_report = report
            except BarangayMonthlyReport.DoesNotExist:
                pass

        media.save()
        return Response(
            ReportMediaSerializer(media, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ReportMediaDetailView(generics.RetrieveDestroyAPIView):
    queryset = ReportMedia.objects.all()
    serializer_class = ReportMediaSerializer
    lookup_field = 'media'
    permission_classes = [CanAccessOwnBarangayReportMedia]
    

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