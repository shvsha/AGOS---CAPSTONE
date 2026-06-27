from rest_framework import serializers
from .models import SensorReading
from apps.sensor_nodes.models import SensorNode

class SensorReadingSerializer(serializers.ModelSerializer):
    node = serializers.PrimaryKeyRelatedField(
        queryset=SensorNode.objects.all(),
        write_only=True
    )
    node_details = serializers.SerializerMethodField()

    class Meta:
        model = SensorReading
        fields = [
            'reading_id', 'node', 'node_details',
            'water_level', 'water_flow_rate', 'water_flow',
            'reading_status', 'clog_pct', 'timestamp',
        ]

    def get_node_details(self, obj):
        node = obj.node
        return {
            'node_id': node.node_id,
            'node_name': node.node_name,
            'barangay_details': {
                'barangay_id': node.barangay.barangay_id,
                'barangay_name': node.barangay.barangay_name,
            },
            'hotspot_details': {
                'hotspot_id': node.hotspot.hotspot_id,
                'name': node.hotspot.name,
                'latitude': node.hotspot.latitude,
                'longitude': node.hotspot.longitude,
            } if node.hotspot else None,
        }