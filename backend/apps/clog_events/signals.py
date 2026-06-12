from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert

@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if not created:
        return

    Alert.objects.create(
        event=instance,
        node=instance.node,
        alert_type='High_Clog_Index'
    )