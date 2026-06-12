from rest_framework import serializers
from .models import Alert
from apps.clog_events.serializers import ClogEventSerializer

class AlertSerializer(serializers.ModelSerializer):
    node_name     = serializers.SerializerMethodField()
    barangay_name = serializers.SerializerMethodField()

    class Meta:
        model  = Alert
        fields = ['alert_id', 'alert_type', 'node_name', 'barangay_name', 'timestamp']

    def get_node_name(self, obj):
        return obj.node.node_name if obj.node else None

    def get_barangay_name(self, obj):
        return obj.node.barangay.barangay_name if obj.node else None