import os
import logging
from datetime import timedelta
from django.utils import timezone

from .models import BackupConfig, BackupLog
from .services import create_backup_archive

logger = logging.getLogger(__name__)

FREQUENCY_DELTA = {
    'daily': timedelta(days=1),
    'weekly': timedelta(weeks=1),
    'monthly': timedelta(days=30),
}


def run_scheduled_backup_check():
    """
    Runs daily. Decides internally whether a scheduled backup is
    actually due, based on BackupConfig.frequency and the last
    successful scheduled backup's timestamp.
    """
    config = BackupConfig.objects.first()

    if not config or not config.auto_backup_enabled:
        return

    if not config.server_backup_path or not os.path.isdir(config.server_backup_path):
        logger.warning("Scheduled backup skipped: server_backup_path is missing or invalid.")
        BackupLog.objects.create(
            backup_type='scheduled',
            status='failed',
            error_message='server_backup_path is missing or invalid.',
        )
        return

    last_success = BackupLog.objects.filter(
        backup_type='scheduled', status='success'
    ).order_by('-created_at').first()

    if last_success:
        due_at = last_success.created_at + FREQUENCY_DELTA[config.frequency]
        if timezone.now() < due_at:
            return  # not due yet

    try:
        archive_path = create_backup_archive(config.server_backup_path)
        BackupLog.objects.create(
            backup_type='scheduled',
            status='success',
            file_name=os.path.basename(archive_path),
        )
        logger.info("Scheduled backup completed: %s", archive_path)
    except Exception as e:
        BackupLog.objects.create(
            backup_type='scheduled',
            status='failed',
            error_message=str(e),
        )
        logger.exception("Scheduled backup failed.")