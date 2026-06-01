from django.apps import AppConfig

class ReportsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reports'

    def ready(self):
        import sys
        if 'runserver' in sys.argv:
            from .scheduler import start
            start()