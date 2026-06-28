from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WasteClassification


@receiver(post_save, sender=WasteClassification)
def link_classification_to_clog_event(sender, instance, created, **kwargs):
    pass  # ClogEvent creation handled in sensor_readings/signals.py
          # classification_id linking not used in current UI — revisit later