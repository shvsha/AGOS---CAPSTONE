from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
from .serializers import ( BarangayMonthlyReportSerializer, ReportMediaSerializer, MunicipalMonthlyReportSerializer )

class BarangayMonthlyReportListView(generics.ListCreateAPIView):
    serializer_class = BarangayMonthlyReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return BarangayMonthlyReport.objects.filter(
                barangay=user.barangay
            ).order_by('-submitted_at')
        return BarangayMonthlyReport.objects.all().order_by('-submitted_at')

class BarangayMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BarangayMonthlyReport.objects.all()
    serializer_class = BarangayMonthlyReportSerializer
    lookup_field = 'monthly_report_id'

class ReportMediaListView(generics.ListCreateAPIView):
    queryset = ReportMedia.objects.all()
    serializer_class = ReportMediaSerializer

class MunicipalMonthlyReportListView(generics.ListCreateAPIView):
    queryset = MunicipalMonthlyReport.objects.all().order_by('-generated_at')
    serializer_class = MunicipalMonthlyReportSerializer

class MunicipalMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MunicipalMonthlyReport.objects.all()
    serializer_class = MunicipalMonthlyReportSerializer
    lookup_field = 'municipal_report_id'

class GenerateMunicipalReportView(APIView):
    def post(self, request):
        report_month = request.data.get('report_month')

        submitted_reports = BarangayMonthlyReport.objects.filter(
            report_month=report_month
        )

        if not submitted_reports.exists():
            return Response(
                {'error': 'No barangay reports found for this month'},
                status=status.HTTP_404_NOT_FOUND
            )

        totals = submitted_reports.aggregate(
            total_recyclables=Sum('recyclables_kg'),
            total_amount_sold=Sum('amount_sold'),
            total_biodegradable=Sum('biodegradable_kg'),
            total_composting=Sum('composting_kg'),
            total_residual=Sum('residual_waste_kg'),
            total_special=Sum('special_waste_kg'),
            total_clog_events=Sum('clog_events_addressed'),
        )

        report, created = MunicipalMonthlyReport.objects.update_or_create(
            report_month=report_month,
            defaults={
                'total_recyclables_kg': totals['total_recyclables'] or 0,
                'total_amount_sold': totals['total_amount_sold'] or 0,
                'total_biodegradable_kg': totals['total_biodegradable'] or 0,
                'total_composting_kg': totals['total_composting'] or 0,
                'total_residual_waste_kg': totals['total_residual'] or 0,
                'total_special_waste_kg': totals['total_special'] or 0,
                'total_barangays_reported': submitted_reports.count(),
                'total_clog_events': totals['total_clog_events'] or 0,
                'generated_by': request.user,
                'status': 'Draft',
            }
        )

        return Response(
            MunicipalMonthlyReportSerializer(report).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )