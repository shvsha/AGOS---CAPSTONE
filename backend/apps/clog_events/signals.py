# The SensorReading post_save receiver that used to live here has been
# consolidated into apps/sensor_readings/signals.py to eliminate a
# duplicate-receiver bug (both files were firing the same alert/clog
# logic on every reading). See that file for the current logic.

from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import ClogEvent
from .serializers import ClogEventSerializer


@receiver(post_save, sender=ClogEvent)
def broadcast_new_clog_event(sender, instance, created, **kwargs):
    if not created:
        return

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "clog_events",
        {"type": "clog_event_message", "clog_event": ClogEventSerializer(instance).data}
    )