from rest_framework import serializers
from .models import Alert
from apps.clog_events.serializers import ClogEventSerializer

class AlertSerializer(serializers.ModelSerializer):
    event_details = ClogEventSerializer(source='event', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'