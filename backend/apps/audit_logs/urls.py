from django.urls import path
from .views import AuditLogListView, AuditLogByUserView, AuditLogExportView

urlpatterns = [
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('audit-logs/user/<int:user_id>/', AuditLogByUserView.as_view(), name='audit-log-by-user'),
    path('audit-logs/export/', AuditLogExportView.as_view(), name='audit-log-export'),
]