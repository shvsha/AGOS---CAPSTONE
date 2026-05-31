from rest_framework import serializers
from .models import SensorNode, SystemHealthLog
from apps.barangay.serializers import BarangaySerializer

class SensorNodeSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)

    class Meta:
        model = SensorNode
        fields = '__all__'

class SystemHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemHealthLog
        fields = '__all__'