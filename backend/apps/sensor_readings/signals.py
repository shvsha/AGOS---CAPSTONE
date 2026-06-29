from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert
from django.utils import timezone
from datetime import timedelta

CLOG_PCT_THRESHOLDS = {
    'High':   80,
    'Medium': 60,
    'Low':    30,
}

def get_clog_severity(clog_pct):
    if clog_pct is None:
        return None
    if clog_pct >= CLOG_PCT_THRESHOLDS['High']:
        return 'High'
    if clog_pct >= CLOG_PCT_THRESHOLDS['Medium']:
        return 'Medium'
    if clog_pct >= CLOG_PCT_THRESHOLDS['Low']:
        return 'Low'
    return None


@receiver(post_save, sender=SensorReading)
def handle_abnormal_reading(sender, instance, created, **kwargs):
    if not created:
        return

    # Water_Level_Rising — fires on Warning OR Critical, once per hour
    if instance.reading_status in ('Warning', 'Critical'):
        recently_alerted = Alert.objects.filter(
            node=instance.node,
            alert_type='Water_Level_Rising',
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        if not recently_alerted:
            Alert.objects.create(
                node=instance.node,
                alert_type='Water_Level_Rising',
                alert_context={
                    'water_level':     instance.water_level,
                    'water_flow_rate': instance.water_flow_rate,
                    'water_flow':      instance.water_flow,
                }
            )

    # ClogEvent — only if none already open
    severity = get_clog_severity(instance.clog_pct)
    if severity is None:
        return

    already_open = ClogEvent.objects.filter(
    node=instance.node,
        status__in=['Detected', 'Responded']
    ).first()  # ← change .exists() to .first() so we can update it

    if not already_open:
        ClogEvent.objects.create(
            node=instance.node,
            barangay=instance.node.barangay,
            severity=severity,
            status='Detected'
        )
    else:
        severity_rank = {'Low': 1, 'Medium': 2, 'High': 3}
        if severity_rank.get(severity, 0) > severity_rank.get(already_open.severity, 0):
            already_open.severity = severity
            already_open.save()  # ← this triggers clog_events/signals.py now