from rest_framework import serializers
from .models import SensorNode, SystemHealthLog
from apps.barangay.models import Barangay
from apps.hotspots.models import Hotspot
from apps.sensor_readings.models import SensorReading


class SensorNodeSerializer(serializers.ModelSerializer):
    barangay = serializers.PrimaryKeyRelatedField(
        queryset=Barangay.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    hotspot = serializers.PrimaryKeyRelatedField(
        queryset=Hotspot.objects.all(),
        write_only=True,
        allow_null=True,
        required=False
    )
    barangay_details = serializers.SerializerMethodField()
    hotspot_details = serializers.SerializerMethodField()

    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    water_level = serializers.SerializerMethodField()
    water_flow_rate = serializers.SerializerMethodField()
    clog_pct = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    health_status = serializers.SerializerMethodField()

    class Meta:
        model = SensorNode
        fields = [
            'node_id', 'node_name',
            'barangay', 'barangay_details',
            'hotspot', 'hotspot_details',
            'latitude', 'longitude',
            'availability_status', 'status',
            'installed_at',
            'water_level', 'water_flow_rate', 'clog_pct', 'condition',
            'health_status',
        ]
        extra_kwargs = {
            'installed_at': {'required': False},
        }

    def _latest(self, obj):
        return SensorReading.objects.filter(node=obj).order_by('-timestamp').first()

    def _latest_health(self, obj):
        return SystemHealthLog.objects.filter(node=obj).order_by('-checked_at').first()

    def get_barangay_details(self, obj):
        if not obj.barangay:
            return None
        return {
            'barangay_id': obj.barangay.barangay_id,
            'barangay_name': obj.barangay.barangay_name,
        }

    def get_hotspot_details(self, obj):
        if not obj.hotspot:
            return None
        return {
            'hotspot_id': obj.hotspot.hotspot_id,
            'name': obj.hotspot.name,
            'description': obj.hotspot.description,
            'latitude': obj.hotspot.latitude,
            'longitude': obj.hotspot.longitude,
        }

    def get_latitude(self, obj):
        return obj.hotspot.latitude if obj.hotspot else None

    def get_longitude(self, obj):
        return obj.hotspot.longitude if obj.hotspot else None

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

    def get_health_status(self, obj):
        h = self._latest_health(obj)
        return h.status if h else None

    def validate(self, attrs):
        hotspot = attrs.get('hotspot')

        if hotspot:
            existing = SensorNode.objects.filter(
                hotspot=hotspot
            ).exclude(availability_status='Retired')

            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError(
                    {'hotspot': 'This hotspot is already occupied by an active node.'}
                )

        return attrs


class SystemHealthLogSerializer(serializers.ModelSerializer):
    node_details = SensorNodeSerializer(source='node', read_only=True)
    node = serializers.PrimaryKeyRelatedField(
        queryset=SensorNode.objects.all(),
        write_only=True
    )

    class Meta:
        model = SystemHealthLog
        fields = [
            'health_id', 'node', 'node_details',
            'battery_voltage', 'signal_strength', 'sensor_continuity',
            'status', 'checked_at',
        ]