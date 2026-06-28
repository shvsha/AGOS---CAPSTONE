from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert
from django.utils import timezone
from datetime import timedelta


# clog_pct thresholds for ClogEvent severity
CLOG_PCT_THRESHOLDS = {
    'High':   80,
    'Medium': 60,
    'Low':    30,
}


def get_clog_severity(clog_pct):
    """Map clog_pct to a severity tier, or None if not high enough."""
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

    # --- Alerts for water level status (early warning, always fires) ---
    if instance.reading_status == 'Warning':
        recently_alerted = Alert.objects.filter(
            node=instance.node,
            alert_type='Water_Level_Rising',
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        if not recently_alerted:
            Alert.objects.create(
                node=instance.node,
                alert_type='Water_Level_Rising'
            )

    elif instance.reading_status == 'Critical':
        recently_alerted = Alert.objects.filter(
            node=instance.node,
            alert_type='Critical_Clog',
            timestamp__gte=timezone.now() - timedelta(hours=1)
        ).exists()
        if not recently_alerted:
            Alert.objects.create(
                node=instance.node,
                alert_type='Critical_Clog'
            )

    # --- ClogEvent from clog_pct (primary clog detection logic) ---
    # clog_pct is computed from optical flow + water level trend
    # Only create a ClogEvent if clog_pct is high enough
    severity = get_clog_severity(instance.clog_pct)
    if severity is None:
        return

    # Deduplication — don't create a new event if one is already open
    already_open = ClogEvent.objects.filter(
        node=instance.node,
        status__in=['Detected', 'Responded']
    ).exists()
    if already_open:
        return

    ClogEvent.objects.create(
        node=instance.node,
        barangay=instance.node.barangay,
        severity=severity,
        status='Detected'
    )