from datetime import timedelta

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import SensorReading
from apps.clog_events.models import ClogEvent
from apps.alerts.models import Alert

from apps.rainfall.services import get_effective_condition
from apps.rainfall.models import AlertThreshold


def get_clear_streak_count(barangay):
    condition = get_effective_condition(barangay) if barangay else 'None'
    try:
        return AlertThreshold.objects.get(condition=condition).clear_streak_count
    except AlertThreshold.DoesNotExist:
        return 5  # safe fallback

CLOG_PCT_THRESHOLDS = {
    'High':   80,
    'Medium': 60,
    'Low':    30,
}

CLOG_SEVERITY_RANK = {
    'Low': 1,
    'Medium': 2,
    'High': 3,
}

WATER_LEVEL_SEVERITY_RANK = {
    'Normal':   0,
    'Warning':  1,
    'Critical': 2,
}

WATER_LEVEL_COOLDOWN = timedelta(hours=1)
CLOG_ALERT_COOLDOWN = timedelta(hours=1)


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

    CLOG_ALERT_TYPE_BY_SEVERITY = {
        'Low':    'Low_Clog_Alert',
        'Medium': 'Moderate_Clog_Alert',
        'High':   'Critical_Clog',
    }

    # --- ClogEvent ---------------------------------------------------
    already_open = ClogEvent.objects.filter(
        node=instance.node,
        status__in=['Detected', 'Responded']
    ).first()

    severity = get_clog_severity(instance.clog_pct)

    if severity is None:
        if instance.clog_pct is None:
            return

        # Genuine confirmed-clear reading (clog_pct is a real number, just < 30%).
        if already_open:
            already_open.clear_streak += 1
            required = get_clear_streak_count(already_open.barangay)
            if already_open.clear_streak >= required:
                already_open.status = 'Cleared'
                already_open.resolved_at = timezone.now()
            already_open.save()
        return

    # From here on, this reading is a genuine Low/Medium/High clog.
    if not already_open:
        clog_event = ClogEvent.objects.create(
            node=instance.node,
            barangay=instance.node.barangay,
            severity=severity,
            first_severity=severity,
            peak_severity=severity,
            clear_streak=0,
            status='Detected'
        )
    else:
        clog_event = already_open
        clog_event.clear_streak = 0  # any real clog reading breaks the clear streak

        if severity != clog_event.severity:
            clog_event.severity = severity

        if CLOG_SEVERITY_RANK.get(severity, 0) > CLOG_SEVERITY_RANK.get(clog_event.peak_severity, 0):
            clog_event.peak_severity = severity

        clog_event.save()

    last_alert = Alert.objects.filter(
        node=instance.node,
        event=clog_event,
    ).order_by('-timestamp').first()

    re_alert_type = CLOG_ALERT_TYPE_BY_SEVERITY[clog_event.severity]

    should_alert = False
    if last_alert is None:
        should_alert = True
    else:
        cooldown_expired = (timezone.now() - last_alert.timestamp) >= CLOG_ALERT_COOLDOWN
        last_severity = last_alert.alert_context.get('severity', clog_event.severity)
        is_escalation = (
            CLOG_SEVERITY_RANK.get(clog_event.severity, 0)
            > CLOG_SEVERITY_RANK.get(last_severity, 0)
        )
        should_alert = cooldown_expired or is_escalation

    if should_alert:
        Alert.objects.create(
            event=clog_event,
            node=instance.node,
            alert_type=re_alert_type,
            alert_context={'severity': clog_event.severity}
        )