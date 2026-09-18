from django.core.management.base import BaseCommand
from django.conf import settings
from apps.sensor_readings.mqtt_client import build_client


class Command(BaseCommand):
    help = "Runs a persistent MQTT subscriber (blocking) that writes incoming sensor readings to the database. For local dev — for production, use the embedded listener instead (see apps.py / mqtt_client.py)."

    def handle(self, *args, **options):
        client = build_client()
        print(f"[MQTT] Connecting to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}...")
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
        client.loop_forever()