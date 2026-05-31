from django.apps import AppConfig

class ClogEventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.clog_events'

    def ready(self):
        import apps.clog_events.signals