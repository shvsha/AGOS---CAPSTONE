import os
from rest_framework.exceptions import ValidationError
from .validators import validate_upload, convert_heic_to_jpeg
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import CanalMonitoringReport, ReportMedia
from .serializers import CanalMonitoringReportSerializer, ReportMediaSerializer
from apps.users.permissions import (
    IsBarangay, IsAdminOrMENROOrBarangay, IsAdminOrMENROOfficer,
    CanAccessOwnCanalReport, CanAccessOwnCanalReportMedia,
)
from apps.audit_logs.utils import log_action
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from agos_backend.pdf_utils import render_custom_pdf, get_logo_data_uri


class CanalMonitoringReportListView(generics.ListCreateAPIView):
    serializer_class = CanalMonitoringReportSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['barangay', 'severity']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsBarangay()]
        return [IsAdminOrMENROOrBarangay()]

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return CanalMonitoringReport.objects.filter(
                barangay=user.barangay
            ).order_by('-date_observed')
        return CanalMonitoringReport.objects.filter(is_submitted=True).order_by('-date_observed')

    def perform_create(self, serializer):
        report = serializer.save(
            barangay=self.request.user.barangay,
            reported_by=self.request.user,
        )
        log_action(
            user=self.request.user,
            action='Filed Canal Monitoring Report',
            affected_table='tbl_canal_monitoring_reports',
            new_value=f"barangay: {report.barangay.barangay_name}, observed: {report.date_observed}",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )


class CanalMonitoringReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CanalMonitoringReport.objects.all()
    serializer_class = CanalMonitoringReportSerializer
    lookup_field = 'report_id'
    permission_classes = [CanAccessOwnCanalReport]


class CanalMonitoringReportExportView(APIView):
    """
    GET /api/canal-reports/<id>/export/
    Exports a single canal monitoring report as PDF.
    Same access rule as the detail view: Admin/MENRO any report,
    Barangay only their own.
    """
    permission_classes = [CanAccessOwnCanalReport]

    def get(self, request, report_id):
        report = get_object_or_404(CanalMonitoringReport, report_id=report_id)
        self.check_object_permissions(request, report)

        context = {
            "logo_data_uri": get_logo_data_uri(),
            "report": report,
            "generated_by": f"{request.user.first_name} {request.user.last_name}",
        }

        filename = f"{report.barangay.barangay_name}-Canal-Report-{report.date_observed.strftime('%b-%d-%Y')}.pdf"

        return render_custom_pdf(
            "exports/canal_monitoring_report.html",
            context,
            filename=filename,
        )


class MyReportsListView(generics.ListAPIView):
    """
    GET /api/canal-reports/mine/
    Returns every report filed by the current Barangay user's own
    barangay. Replaces the old single-per-month "mine" lookup — since
    reports are per-incident now, not one-per-month, this is a list.
    Barangay-only — scoped to request.user.barangay, no barangay param
    needed/trusted.
    """
    serializer_class = CanalMonitoringReportSerializer
    permission_classes = [IsBarangay]

    def get_queryset(self):
        return CanalMonitoringReport.objects.filter(
            barangay=self.request.user.barangay
        ).order_by('-date_observed')


class ReportMediaListView(generics.ListAPIView):
    queryset = ReportMedia.objects.all()
    serializer_class = ReportMediaSerializer
    permission_classes = [IsAdminOrMENROOfficer]


class ReportMediaUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAdminOrMENROOrBarangay]

    def post(self, request):
        file = request.FILES.get('file')
        media_category = request.data.get('media_category', 'Additional_Evidence')
        clog_event_id = request.data.get('clog_event_id')
        report_id = request.data.get('report_id')

        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            validate_upload(file, 'Image')
        except ValidationError as e:
            detail = e.detail[0] if hasattr(e, 'detail') else str(e)
            return Response({'error': str(detail)}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        if ext in {'.heic', '.heif'}:
            file = convert_heic_to_jpeg(file)

        media = ReportMedia(file_path=file, media_type='Image', media_category=media_category, uploaded_by=request.user)

        if clog_event_id:
            from apps.clog_events.models import ClogEvent
            try:
                media.clog_event_id = ClogEvent.objects.get(event_id=clog_event_id)
            except ClogEvent.DoesNotExist:
                pass

        if report_id:
            try:
                report = CanalMonitoringReport.objects.get(report_id=report_id)
                if request.user.user_role == 'Barangay' and report.barangay_id != request.user.barangay_id:
                    return Response({'error': 'Not your report.'}, status=status.HTTP_403_FORBIDDEN)
                media.report = report
            except CanalMonitoringReport.DoesNotExist:
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
    permission_classes = [CanAccessOwnCanalReportMedia]


class ReportMediaByClogEventView(generics.ListAPIView):
    serializer_class = ReportMediaSerializer
    permission_classes = [IsAdminOrMENROOrBarangay]

    def get_queryset(self):
        event_id = self.kwargs['event_id']
        return ReportMedia.objects.filter(clog_event_id=event_id)