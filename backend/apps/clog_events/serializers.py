from rest_framework import serializers
from .models import ClogEvent
from apps.barangay.serializers import BarangaySerializer
from apps.sensor_nodes.serializers import SensorNodeSerializer
from apps.users.serializers import UserSerializer
from apps.waste_classification.serializers import WasteClassificationSerializer

class ClogEventSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)
    node_details = SensorNodeSerializer(source='node', read_only=True)
    classification_details = WasteClassificationSerializer(source='classification', read_only=True)
    cleared_by_details = UserSerializer(source='cleared_by', read_only=True)

    class Meta:
        model = ClogEvent
        fields = '__all__'