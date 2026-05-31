from django.urls import path
from .views import AuditLogListView, AuditLogByUserView

urlpatterns = [
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('audit-logs/user/<int:user_id>/', AuditLogByUserView.as_view(), name='audit-log-by-user'),
]