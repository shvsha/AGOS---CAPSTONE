from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert
from apps.users.models import User

@receiver(post_save, sender=SensorReading)
def handle_abnormal_reading(sender, instance, created, **kwargs):
    if not created or instance.reading_status == 'Normal':
        return

    # Determine alert type — NOT clog related
    if instance.reading_status == 'Overflow':
        alert_type = 'Overflow_Detected'
    else:
        alert_type = 'Water_Level_Rising'

    # Fire alert
    recipients = list(User.objects.filter(user_role__in=['Admin', 'MENRO'], status='Active'))
    recipients += list(User.objects.filter(user_role='Barangay', barangay=instance.node.barangay, status='Active'))

    for user in recipients:
        Alert.objects.create(
            node=instance.node,
            user=user,
            alert_type=alert_type
        )

    # Create ClogEvent only if actual blockage
    if not instance.clog_pct or instance.clog_pct < 30:
        return

    if instance.water_level >= 90:
        severity = 'High'
    elif instance.water_level >= 70:
        severity = 'Medium'
    else:
        severity = 'Low'

    if instance.water_flow == 'Stagnant' and severity != 'High':
        severity = 'High' if severity == 'Medium' else 'Medium'

    ClogEvent.objects.create(
        node=instance.node,
        barangay=instance.node.barangay,
        severity=severity,
        status='Detected'
    )