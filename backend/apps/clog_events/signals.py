from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert


@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if not created:
        return

    # alert_type choice based on severity — adjust this mapping if your own
    # definition of "High_Clog_Index" vs "Critical_Clog" differs
    alert_type = 'Critical_Clog' if instance.severity == 'High' else 'High_Clog_Index'

    Alert.objects.create(
        event=instance,
        node=instance.node,
        alert_type=alert_type,
    )