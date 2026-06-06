from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SystemHealthLog
from apps.alerts.models import Alert
from apps.users.models import User

@receiver(post_save, sender=SystemHealthLog)
def create_health_alert(sender, instance, created, **kwargs):
    if not created:
        return

    alert_type = None

    # Check battery voltage
    if instance.battery_voltage < 3.3:
        alert_type = 'Low_Battery'

    # Check signal strength (RSSI — more negative = weaker)
    elif instance.signal_strength < -90:
        alert_type = 'Weak_Signal'

    # Check sensor continuity
    elif not instance.sensor_continuity:
        alert_type = 'Sensor_Failure'

    # Check node status
    elif instance.status == 'Critical':
        alert_type = 'Node_Offline'

    # Only create alert if there's an issue
    if alert_type:
        # Only notify Admin users
        admins = User.objects.filter(
            user_role='Admin',
            status='Active'
        )

        for admin in admins:
            Alert.objects.create(
                event=None,  # No clog event for health alerts
                user=admin,
                alert_type=alert_type
            )