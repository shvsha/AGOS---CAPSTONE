from django.urls import path
from .views import ManualBackupView, RestoreBackupView, BackupConfigView, BackupLogListView

urlpatterns = [
    path('backup/manual/', ManualBackupView.as_view(), name='manual-backup'),
    path('backup/restore/', RestoreBackupView.as_view(), name='restore-backup'),
    path('backup/config/', BackupConfigView.as_view(), name='backup-config'),
    path('backup/logs/', BackupLogListView.as_view(), name='backup-logs'),
]