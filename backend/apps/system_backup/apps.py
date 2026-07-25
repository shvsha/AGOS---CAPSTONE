from django.apps import AppConfig


class SystemBackupConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.system_backup'

    def ready(self):
        import sys
        if 'runserver' in sys.argv:
            from .scheduler import start
            start()