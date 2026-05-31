from django.urls import path
from .views import ( BarangayMonthlyReportListView, BarangayMonthlyReportDetailView, ReportMediaListView, MunicipalMonthlyReportListView, MunicipalMonthlyReportDetailView, GenerateMunicipalReportView)

urlpatterns = [
    path('barangay-reports/', BarangayMonthlyReportListView.as_view(), name='barangay-report-list'),
    path('barangay-reports/<int:monthly_report_id>/', BarangayMonthlyReportDetailView.as_view(), name='barangay-report-detail'),
    path('report-media/', ReportMediaListView.as_view(), name='report-media-list'),
    path('municipal-reports/', MunicipalMonthlyReportListView.as_view(), name='municipal-report-list'),
    path('municipal-reports/<int:municipal_report_id>/', MunicipalMonthlyReportDetailView.as_view(), name='municipal-report-detail'),
    path('municipal-reports/generate/', GenerateMunicipalReportView.as_view(), name='generate-municipal-report'),
]