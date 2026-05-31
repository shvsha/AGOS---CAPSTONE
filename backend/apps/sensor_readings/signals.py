from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent

@receiver(post_save, sender=SensorReading)
def create_clog_event_on_abnormal(sender, instance, created, **kwargs):
    if created and instance.reading_status == 'Abnormal':
        # Determine severity based on water level
        if instance.water_level >= 90:
            severity = 'High'
        elif instance.water_level >= 70:
            severity = 'Medium'
        else:
            severity = 'Low'

        ClogEvent.objects.create(
            node=instance.node,
            barangay=instance.node.barangay,
            severity=severity,
            status='Detected'
        )