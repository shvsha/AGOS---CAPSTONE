from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert

@receiver(post_save, sender=SensorReading)
def handle_abnormal_reading(sender, instance, created, **kwargs):
    if not created or instance.reading_status == 'Normal':
        return

    if instance.reading_status == 'Warning':
        Alert.objects.create(
            node=instance.node,
            alert_type='Water_Level_Rising'
        )
        return

    if instance.reading_status == 'Critical':
        Alert.objects.create(
            node=instance.node,
            alert_type='Critical_Clog'
        )

        # Determine severity
        if instance.water_level >= 75:
            severity = 'High'
        elif instance.water_level >= 50:
            severity = 'Medium'
        else:
            severity = 'Low'

        # Upgrade severity if stagnant
        if instance.water_flow == 'Stagnant' and severity != 'High':
            severity = 'High' if severity == 'Medium' else 'Medium'

        ClogEvent.objects.create(
            node=instance.node,
            barangay=instance.node.barangay,
            severity=severity,
            status='Detected'
        )