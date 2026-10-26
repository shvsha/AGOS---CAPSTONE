from django.urls import path
from .views import (
    CanalMonitoringReportListView, CanalMonitoringReportDetailView, CanalMonitoringReportExportView,
    MyReportsListView,
    ReportMediaListView, ReportMediaUploadView, ReportMediaDetailView, ReportMediaByClogEventView, SignatoryStatusView,
    CustomWasteTypeListCreateView, CustomWasteTypeReviewView, CanalReportSystemDataView, CanalReportCompletePostView, 
    CanalReportVerifyView, CanalReportCompleteView, CleanupPreviewView, CanalReportPurokRowsView
)
from .submission_views import PeriodListView, SubmissionPreviewView, SubmissionsView

urlpatterns = [
    path('canal-reports/', CanalMonitoringReportListView.as_view()),
    path('canal-reports/mine/', MyReportsListView.as_view()),
    path('canal-reports/<int:report_id>/', CanalMonitoringReportDetailView.as_view()),
    path('canal-reports/<int:report_id>/export/', CanalMonitoringReportExportView.as_view()),
    path('report-media/', ReportMediaListView.as_view()),
    path('report-media/upload/', ReportMediaUploadView.as_view()),
    path('report-media/<int:media>/', ReportMediaDetailView.as_view()),
    path('canal-reports/signatory-status/', SignatoryStatusView.as_view()),
    path('report-media/clog-event/<int:event_id>/', ReportMediaByClogEventView.as_view(), name='report-media-by-clog-event'),
    path('custom-waste-types/', CustomWasteTypeListCreateView.as_view()),
    path('custom-waste-types/<int:waste_type_id>/', CustomWasteTypeReviewView.as_view()),
    path('canal-reports/<int:report_id>/system-data/', CanalReportSystemDataView.as_view()),
    path('canal-reports/<int:report_id>/complete-post/', CanalReportCompletePostView.as_view()),
    path('canal-reports/<int:report_id>/verify/', CanalReportVerifyView.as_view()),
    path('canal-reports/periods/', PeriodListView.as_view()),
    path('canal-reports/submission-preview/', SubmissionPreviewView.as_view()),
    path('canal-reports/submissions/', SubmissionsView.as_view()),
    path('canal-reports/<int:report_id>/complete/', CanalReportCompleteView.as_view()),
    path('canal-reports/cleanup-preview/', CleanupPreviewView.as_view()),
    path('canal-reports/<int:report_id>/purok-rows/', CanalReportPurokRowsView.as_view()),
]