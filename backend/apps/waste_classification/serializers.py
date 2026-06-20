from rest_framework import serializers
from .models import WasteClassification
from apps.sensor_nodes.serializers import SensorNodeSerializer

class WasteClassificationSerializer(serializers.ModelSerializer):
    waste_breakdown = serializers.SerializerMethodField()
    node_details = SensorNodeSerializer(source='node', read_only=True)

    class Meta:
        model = WasteClassification
        fields = '__all__'

    def get_waste_breakdown(self, obj):
        return {
            'Recyclable': obj.recyclable_pct,
            'Biodegradable': obj.biodegradable_pct,
            'Residual': obj.residual_pct,
            'Special Waste': obj.special_waste_pct,
            'None': obj.none_pct,
        }