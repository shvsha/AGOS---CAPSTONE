from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert
from django.utils import timezone
from datetime import timedelta


@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if not created:
        return

    # Determine alert type based on severity
    # Critical_Clog  → clog_pct >= 80 (High severity)
    # High_Clog_Index → clog_pct 30-79 (Low or Medium severity)
    if instance.severity == 'High':
        alert_type = 'Critical_Clog'
    else:
        alert_type = 'High_Clog_Index'

    # Deduplication — only 1 alert per type per node per hour
    recently_alerted = Alert.objects.filter(
        node=instance.node,
        alert_type=alert_type,
        timestamp__gte=timezone.now() - timedelta(hours=1)
    ).exists()

    if not recently_alerted:
        Alert.objects.create(
            event=instance,
            node=instance.node,
            alert_type=alert_type,
        )