from django.urls import path
from .views import (
    ManualBackupView, RestoreBackupView, BackupConfigView,
    BackupLogListView, RestorePointListView, RestoreFromServerView,
)

urlpatterns = [
    path('backup/manual/', ManualBackupView.as_view(), name='manual-backup'),
    path('backup/restore/', RestoreBackupView.as_view(), name='restore-backup'),
    path('backup/restore-from-server/', RestoreFromServerView.as_view(), name='restore-from-server'),
    path('backup/config/', BackupConfigView.as_view(), name='backup-config'),
    path('backup/logs/', BackupLogListView.as_view(), name='backup-logs'),
    path('backup/restore-points/', RestorePointListView.as_view(), name='restore-points'),
]