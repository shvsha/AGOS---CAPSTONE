from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent

@receiver(post_save, sender=SensorReading)
def create_clog_event_on_abnormal(sender, instance, created, **kwargs):
    if not created or instance.reading_status != 'Abnormal':
        return

    # Severity based on water level + water flow combined
    # Water level thresholds (in cm — adjust to your canal depth)
    if instance.water_level >= 90:
        base_severity = 'High'
    elif instance.water_level >= 70:
        base_severity = 'Medium'
    else:
        base_severity = 'Low'

    # Escalate severity if flow is stagnant (water not moving = worse blockage)
    if instance.water_flow == 'Stagnant':
        if base_severity == 'Low':
            severity = 'Medium'   # escalate
        elif base_severity == 'Medium':
            severity = 'High'     # escalate
        else:
            severity = 'High'     # already max
    elif instance.water_flow == 'Slow':
        severity = base_severity  # no escalation, already noted
    else:
        severity = base_severity  # Normal flow but still abnormal reading

    ClogEvent.objects.create(
        node=instance.node,
        barangay=instance.node.barangay,
        severity=severity,
        status='Detected'
    )