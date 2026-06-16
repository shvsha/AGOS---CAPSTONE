from rest_framework import serializers
from .models import SensorNode, SystemHealthLog
from apps.barangay.serializers import BarangaySerializer
from apps.barangay.models import Barangay
from apps.sensor_readings.models import SensorReading

class SensorNodeSerializer(serializers.ModelSerializer):
    barangay_details = serializers.SerializerMethodField()
    barangay = serializers.PrimaryKeyRelatedField(queryset=Barangay.objects.all(), write_only=True)
    water_level      = serializers.SerializerMethodField()
    water_flow_rate  = serializers.SerializerMethodField()
    clog_pct         = serializers.SerializerMethodField()
    condition        = serializers.SerializerMethodField()

    class Meta:
        model  = SensorNode
        fields = [
            'node_id', 'node_name', 'barangay', 'barangay_details',
            'latitude', 'longitude', 'status', 'installed_at',
            'water_level', 'water_flow_rate', 'clog_pct', 'condition',
        ]
        extra_kwargs = {
            'installed_at': {'required': False}
        }

    def _latest(self, obj):
        return SensorReading.objects.filter(node=obj).order_by('-timestamp').first()

    def get_barangay_details(self, obj):
        return {
            'barangay_id':   obj.barangay.barangay_id,
            'barangay_name': obj.barangay.barangay_name,
        }

    def get_water_level(self, obj):
        r = self._latest(obj)
        return r.water_level if r else None

    def get_water_flow_rate(self, obj):
        r = self._latest(obj)
        return r.water_flow_rate if r else None

    def get_clog_pct(self, obj):
        r = self._latest(obj)
        return r.clog_pct if r else None

    def get_condition(self, obj):
        r = self._latest(obj)
        return r.reading_status if r else None

class SystemHealthLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemHealthLog
        fields = '__all__'