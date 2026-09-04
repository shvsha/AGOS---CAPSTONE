import os
from django.apps import AppConfig


class SensorReadingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sensor_readings'

    def ready(self):
        import apps.sensor_readings.signals

        # Runs the MQTT subscriber as a background thread inside this
        # same web service process, instead of a separate Render
        # service — avoids doubling instance-hours on the free tier
        # (a second always-on service would burn through the shared
        # 750 hrs/month pool well before month-end, on top of the
        # existing keep-alive cron ping).
        #
        # Guarded by an explicit env var rather than auto-detecting —
        # if this service is ever scaled to multiple instances/workers,
        # each one would otherwise start its own listener, all
        # independently subscribing and each writing a duplicate
        # SensorReading for the same MQTT message. Only enable this
        # on exactly one running instance.
        if os.getenv('ENABLE_EMBEDDED_MQTT_LISTENER') == 'true':
            from apps.sensor_readings.mqtt_client import start_embedded_mqtt_listener
            start_embedded_mqtt_listener()