from django.urls import re_path
from apps.alerts.consumers import AlertConsumer
from apps.sensor_readings.consumers import SensorReadingConsumer
from apps.clog_events.consumers import ClogEventConsumer
from apps.waste_classification.consumers import WasteClassificationConsumer

websocket_urlpatterns = [
    re_path(r'ws/alerts/$', AlertConsumer.as_asgi()),
    re_path(r'ws/sensor-readings/$', SensorReadingConsumer.as_asgi()),
    re_path(r'ws/clog-events/$', ClogEventConsumer.as_asgi()),
    re_path(r'ws/waste-classification/$', WasteClassificationConsumer.as_asgi()),
]