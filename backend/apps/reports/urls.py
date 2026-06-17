from django.urls import path
from .views import ( BarangayMonthlyReportListView, BarangayMonthlyReportDetailView, ReportMediaListView, ReportMediaUploadView, ReportMediaByClogEventView, MunicipalMonthlyReportListView, MunicipalMonthlyReportDetailView )

urlpatterns = [
    path('barangay-reports/', BarangayMonthlyReportListView.as_view()),
    path('barangay-reports/<int:monthly_report_id>/', BarangayMonthlyReportDetailView.as_view()),
    path('report-media/', ReportMediaListView.as_view()),
    path('report-media/upload/', ReportMediaUploadView.as_view()),
    path('report-media/clog-event/<int:event_id>/', ReportMediaByClogEventView.as_view(), name='report-media-by-clog-event'),
    path('municipal-reports/', MunicipalMonthlyReportListView.as_view()),
    path('municipal-reports/<int:municipal_report_id>/', MunicipalMonthlyReportDetailView.as_view()),
]