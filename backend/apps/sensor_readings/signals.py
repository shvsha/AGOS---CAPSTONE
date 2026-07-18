from datetime import timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert

CLOG_PCT_THRESHOLDS = {
    'High':   80,
    'Medium': 60,
    'Low':    30,
}

WATER_LEVEL_SEVERITY_RANK = {
    'Normal':   0,
    'Warning':  1,
    'Critical': 2,
}

WATER_LEVEL_COOLDOWN = timedelta(hours=1)


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

    # --- Water_Level_Rising ---------------------------------------
    if instance.reading_status in ('Warning', 'Critical'):
        last_alert = Alert.objects.filter(
            node=instance.node,
            alert_type='Water_Level_Rising',
        ).order_by('-timestamp').first()

        should_alert = False
        if last_alert is None:
            should_alert = True
        else:
            cooldown_expired = (timezone.now() - last_alert.timestamp) >= WATER_LEVEL_COOLDOWN
            last_severity = last_alert.alert_context.get('severity', 'Warning')
            is_escalation = (
                WATER_LEVEL_SEVERITY_RANK.get(instance.reading_status, 0)
                > WATER_LEVEL_SEVERITY_RANK.get(last_severity, 0)
            )
            should_alert = cooldown_expired or is_escalation

        if should_alert:
            Alert.objects.create(
                node=instance.node,
                alert_type='Water_Level_Rising',
                alert_context={
                    'severity':        instance.reading_status,
                    'water_level':     instance.water_level,
                    'water_flow_rate': instance.water_flow_rate,
                    'water_flow':      instance.water_flow,
                }
            )

    # --- ClogEvent — only if none already open ---------------------
    severity = get_clog_severity(instance.clog_pct)
    if severity is None:
        return

    already_open = ClogEvent.objects.filter(
        node=instance.node,
        status__in=['Detected', 'Responded']
    ).first()

    if not already_open:
        clog_event = ClogEvent.objects.create(
            node=instance.node,
            barangay=instance.node.barangay,
            severity=severity,
            status='Detected'
        )
    else:
        clog_event = already_open
        severity_rank = {'Low': 1, 'Medium': 2, 'High': 3}
        if severity_rank.get(severity, 0) > severity_rank.get(already_open.severity, 0):
            clog_event.severity = severity
            clog_event.save()

    # Re-alert every 6 hours while the clog event is still unresolved.
    re_alert_type = 'Critical_Clog' if clog_event.severity == 'High' else 'High_Clog_Index'
    recently_alerted = Alert.objects.filter(
        node=instance.node,
        alert_type=re_alert_type,
        timestamp__gte=timezone.now() - timedelta(hours=6)
    ).exists()
    if not recently_alerted:
        Alert.objects.create(
            event=clog_event,
            node=instance.node,
            alert_type=re_alert_type,
            alert_context={}
        )