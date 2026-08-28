import json
import ssl
import paho.mqtt.client as mqtt
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.sensor_readings.models import SensorReading
from apps.sensor_nodes.models import SensorNode

TOPIC = "agos/nodes/+/readings"


def get_reading_status(water_level, canal_depth):
    pct = (water_level / canal_depth) * 100.0
    if pct >= 45.0:
        return "Critical"
    if pct >= 30.0:
        return "Warning"
    return "Normal"


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected. Subscribing to {TOPIC}")
        client.subscribe(TOPIC)
    else:
        print(f"[MQTT] Connect failed, code {rc}")


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        node_id = payload.get("node")
        water_level = payload.get("water_level")

        node = SensorNode.objects.get(node_id=node_id)
        canal_depth = getattr(node, "canal_depth", 100.0) or 100.0

        reading = SensorReading.objects.create(
            node=node,
            water_level=water_level,
            reading_status=get_reading_status(water_level, canal_depth),
        )
        print(f"[MQTT] Saved reading {reading.reading_id} for node {node_id}: {water_level}cm")

    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")


class Command(BaseCommand):
    help = "Runs a persistent MQTT subscriber that writes incoming sensor readings to the database."

    def handle(self, *args, **options):
        client = mqtt.Client()
        client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
        client.on_connect = on_connect
        client.on_message = on_message

        print(f"[MQTT] Connecting to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}...")
        client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
        client.loop_forever()