from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SystemHealthLog
from apps.alerts.models import Alert

# Single-cell Li-ion discharge curve used app-wide (matches frontend getBatteryPct):
# 3.0V = 0% (empty), 3.6V = 50% (half), 4.2V = 100% (full)
BATTERY_EMPTY_V = 3.0
BATTERY_FULL_V = 4.2
LOW_BATTERY_PCT_THRESHOLD = 25  # = 3.3V on the 3.0–4.2V scale, matches firmware's Warning line exactly


def get_battery_pct(voltage):
    pct = ((voltage - BATTERY_EMPTY_V) / (BATTERY_FULL_V - BATTERY_EMPTY_V)) * 100
    return max(0, min(100, pct))


@receiver(post_save, sender=SystemHealthLog)
def create_health_alert(sender, instance, created, **kwargs):
    if not created:
        return

    alert_type = None

    # Check battery voltage — below 30% capacity on the 3.0V–4.2V scale
    if instance.battery_voltage is not None and get_battery_pct(instance.battery_voltage) < LOW_BATTERY_PCT_THRESHOLD:
        alert_type = 'Low_Battery'

    # Check signal strength (RSSI — more negative = weaker)
    elif instance.signal_strength is not None and instance.signal_strength < -90:
        alert_type = 'Weak_Signal'

    # Check sensor continuity
    elif instance.sensor_continuity is False:
        alert_type = 'Sensor_Failure'

    # Check node status
    elif instance.status == 'Critical':
        alert_type = 'Node_Offline'

    if alert_type:
        Alert.objects.create(
            node=instance.node,
            health_log=instance,
            alert_type=alert_type
        )