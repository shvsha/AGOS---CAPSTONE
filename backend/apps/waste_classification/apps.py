from django.apps import AppConfig

class WasteClassificationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.waste_classification'

    def ready(self):
        import apps.waste_classification.signals