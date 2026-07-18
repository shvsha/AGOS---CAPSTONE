from django.apps import AppConfig


class RainfallConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.rainfall'

    def ready(self):
        import apps.rainfall.signals

        import sys
        if 'runserver' in sys.argv:
            from .scheduler import start
            start()