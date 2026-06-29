from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert
from django.utils import timezone
from datetime import timedelta


@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if instance.severity == 'High':
        alert_type = 'Critical_Clog'
    else:
        alert_type = 'High_Clog_Index'

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
            alert_context={}  # will be patched by _handle_clog_classification
        )