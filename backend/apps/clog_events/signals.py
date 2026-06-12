from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert
from apps.users.models import User

@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if not created:
        return

    recipients = list(User.objects.filter(user_role__in=['Admin', 'MENRO'], status='Active'))
    recipients += list(User.objects.filter(user_role='Barangay', barangay=instance.barangay, status='Active'))

    for user in recipients:
        Alert.objects.create(
            event=instance,
            node=instance.node,
            user=user,
            alert_type='High_Clog_Index'
        )