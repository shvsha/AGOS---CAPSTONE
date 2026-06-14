from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WasteClassification
from apps.alerts.models import Alert

@receiver(post_save, sender=WasteClassification)
def create_high_clog_alert(sender, instance, created, **kwargs):
    if not created:
        return

    Alert.objects.create(
        node=instance.node,
        alert_type='High_Clog_Index'
    )