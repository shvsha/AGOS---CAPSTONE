import re
from rest_framework import serializers
from .models import SensorNode, SystemHealthLog
from apps.barangay.models import Barangay
from apps.hotspots.models import Hotspot
from apps.sensor_readings.models import SensorReading

CODE_PATTERN = re.compile(r'^[A-Za-z0-9\-]+$')


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
    # User only ever types this — the "1" in "SN-1"
    node_code = serializers.CharField(write_only=True, max_length=50)

    barangay_details = serializers.SerializerMethodField()
    hotspot_details = serializers.SerializerMethodField()

    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    water_level = serializers.SerializerMethodField()
    water_flow_rate = serializers.SerializerMethodField()
    clog_pct = serializers.SerializerMethodField()
    condition = serializers.SerializerMethodField()
    health_status = serializers.SerializerMethodField()

    last_reading_at = serializers.SerializerMethodField()

    class Meta:
        model = SensorNode
        fields = [
            'node_id', 'node_name', 'node_code',
            'barangay', 'barangay_details',
            'hotspot', 'hotspot_details',
            'latitude', 'longitude',
            'availability_status', 'status',
            'installed_at',
            'water_level', 'water_flow_rate', 'clog_pct', 'condition',
            'health_status',
            'last_reading_at',
        ]
        extra_kwargs = {
            'node_name': {'read_only': True},
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
        from apps.waste_classification.utils import max_capacity_kg
        return {
            'hotspot_id': obj.hotspot.hotspot_id,
            'name': obj.hotspot.name,
            'description': obj.hotspot.description,
            'latitude': obj.hotspot.latitude,
            'longitude': obj.hotspot.longitude,
            'canal_width': obj.hotspot.canal_width,
            'sensor_height': obj.hotspot.sensor_height,
            'max_capacity_kg': max_capacity_kg(
                obj.hotspot.canal_width, obj.hotspot.sensor_height
            ),
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

    def get_last_reading_at(self, obj):
        r = self._latest(obj)
        return r.timestamp if r else None

    def validate_node_code(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field is required.")
        if not CODE_PATTERN.match(value):
            raise serializers.ValidationError(
                "Only letters, numbers, and hyphens are allowed."
            )
        return value

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

        node_code = attrs.get('node_code')
        if node_code:
            full_name = f"SN-{node_code}"
            qs = SensorNode.objects.filter(node_name=full_name)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'node_code': 'A sensor node with this code already exists.'}
                )
            attrs['node_name'] = full_name

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