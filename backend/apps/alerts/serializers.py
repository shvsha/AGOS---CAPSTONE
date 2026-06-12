from rest_framework import serializers
from .models import Alert, AlertRead

class AlertSerializer(serializers.ModelSerializer):
    node_name     = serializers.SerializerMethodField()
    barangay_name = serializers.SerializerMethodField()
    is_read = serializers.SerializerMethodField()

    class Meta:
        model  = Alert
        fields = ['alert_id', 'alert_type', 'node_name', 'barangay_name', 'timestamp', 'is_read']

    def get_node_name(self, obj):
        return obj.node.node_name if obj.node else None

    def get_barangay_name(self, obj):
        return obj.node.barangay.barangay_name if obj.node else None
    
    def get_is_read(self, obj):
        user = self.context['request'].user
        return obj.reads.filter(user=user).exists()