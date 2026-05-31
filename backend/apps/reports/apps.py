from django.apps import AppConfig

class ReportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reports'

    def ready(self):
        from django.db import connection
        from django.db.utils import OperationalError, ProgrammingError

        try:
            table_names = connection.introspection.table_names()
            if 'django_apscheduler_djangojob' in table_names:
                from .scheduler import start
                start()
        except (OperationalError, ProgrammingError):
            pass