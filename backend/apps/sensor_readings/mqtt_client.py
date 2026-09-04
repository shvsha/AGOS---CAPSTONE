"""
Shared MQTT subscriber logic for AGOS sensor readings.

Used two ways:
  1. Standalone: `python manage.py mqtt_listener` — for local dev,
     runs in its own terminal/process, blocking (loop_forever).
  2. Embedded: started automatically from SensorReadingsConfig.ready()
     when ENABLE_EMBEDDED_MQTT_LISTENER=true — runs as a background
     thread inside the main web service process in production, so no
     second Render service (and no extra instance-hours) is needed.

Both paths share on_connect/on_message so there's only one place to
fix bugs (e.g. the canal_depth fallback fix) instead of two.
"""
import json
import ssl
import paho.mqtt.client as mqtt
from django.conf import settings

TOPIC = "agos/nodes/+/readings"


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected. Subscribing to {TOPIC}")
        client.subscribe(TOPIC)
    else:
        print(f"[MQTT] Connect failed, code {rc}")


def on_message(client, userdata, msg):
    # Imported here, not at module load time — avoids touching Django
    # models before the app registry is fully ready, which matters
    # for the embedded path since this module gets imported during
    # AppConfig.ready() itself.
    from apps.sensor_readings.models import SensorReading
    from apps.sensor_nodes.models import SensorNode

    try:
        payload = json.loads(msg.payload.decode())
        node_id = payload.get("node")
        water_level = payload.get("water_level")

        if water_level is None:
            print(f"[MQTT] Dropped message for node {node_id}: missing water_level")
            return

        node = SensorNode.objects.get(node_id=node_id)

        if not node.hotspot:
            print(f"[MQTT] Dropped reading for node {node_id}: no assigned hotspot")
            return

        canal_depth = node.hotspot.canal_depth
        if not canal_depth or canal_depth <= 0:
            print(f"[MQTT] Dropped reading for node {node_id}: invalid canal_depth")
            return

        if not node.barangay:
            print(f"[MQTT] Dropped reading for node {node_id}: no assigned barangay")
            return

        from apps.rainfall.services import classify_water_level

        classification = classify_water_level(
            water_level=water_level,
            canal_depth=canal_depth,
            barangay=node.barangay,
        )
        reading_status = classification['status']

        reading = SensorReading.objects.create(
            node=node,
            water_level=water_level,
            reading_status=reading_status,
        )
        print(f"[MQTT] Saved reading {reading.reading_id} for node {node_id}: "
              f"{water_level}cm ({reading_status})")

    except SensorNode.DoesNotExist:
        print(f"[MQTT] Dropped message: unknown node {payload.get('node')}")
    except Exception as e:
        print(f"[MQTT] Error processing message: {e}")


def build_client():
    client = mqtt.Client()
    client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.on_connect = on_connect
    client.on_message = on_message
    return client


def start_embedded_mqtt_listener():
    """
    Starts the MQTT subscriber on a background thread inside the
    current process. Non-blocking — safe to call from
    AppConfig.ready(). Uses paho-mqtt's own internal thread
    (loop_start), so no manual threading.Thread wrapper is needed.
    """
    client = build_client()
    print(f"[MQTT] (embedded) Connecting to {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}...")
    client.connect(settings.MQTT_BROKER_HOST, settings.MQTT_BROKER_PORT, keepalive=60)
    client.loop_start()
    return client