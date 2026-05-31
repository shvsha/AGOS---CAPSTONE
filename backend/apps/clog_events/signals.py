from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ClogEvent
from apps.alerts.models import Alert
from apps.users.models import User

@receiver(post_save, sender=ClogEvent)
def create_alerts_on_clog(sender, instance, created, **kwargs):
    if created:
        # Determine alert type
        alert_type = 'Clog' if instance.severity else 'Abnormal_Water_Level'

        # Get all users who should be notified
        recipients = []

        # All Admin users
        admins = User.objects.filter(user_role='Admin', status='Active')
        recipients.extend(admins)

        # All MENRO users
        menro_users = User.objects.filter(user_role='MENRO', status='Active')
        recipients.extend(menro_users)

        # Barangay Personnel of the affected barangay
        barangay_users = User.objects.filter(
            user_role='Barangay',
            barangay=instance.barangay,
            status='Active'
        )
        recipients.extend(barangay_users)

        # Create alert for each recipient
        for user in recipients:
            Alert.objects.create(
                event=instance,
                user=user,
                alert_type=alert_type
            )