import re
from rest_framework import serializers
from .models import Hotspot
from apps.barangay.models import Barangay

CODE_PATTERN = re.compile(r'^[A-Za-z0-9\-]+$')


class HotspotSerializer(serializers.ModelSerializer):
    barangay = serializers.PrimaryKeyRelatedField(
        queryset=Barangay.objects.all(),
        write_only=True
    )
    barangay_details = serializers.SerializerMethodField()
    is_occupied = serializers.SerializerMethodField()

    class Meta:
        model = Hotspot
        fields = [
            'hotspot_id', 'barangay', 'barangay_details',
            'name', 'code', 'description',
            'latitude', 'longitude',
            'canal_width', 'canal_shape', 'sensor_height', 'canal_depth',
            'is_occupied',
            'created_at', 'updated_at',
        ]
        extra_kwargs = {
            'name': {'read_only': True},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }

    def get_barangay_details(self, obj):
        return {
            'barangay_id': obj.barangay.barangay_id,
            'barangay_name': obj.barangay.barangay_name,
        }

    def get_is_occupied(self, obj):
        return obj.is_occupied

    def validate_code(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("This field is required.")
        if not CODE_PATTERN.match(value):
            raise serializers.ValidationError(
                "Only letters, numbers, and hyphens are allowed."
            )
        return value

    def _build_name(self, barangay, code):
        return f"CN-{barangay.barangay_name}-{code}"

    def validate(self, attrs):
        barangay = attrs.get('barangay', getattr(self.instance, 'barangay', None))
        code = attrs.get('code', getattr(self.instance, 'code', None))

        qs = Hotspot.objects.filter(barangay=barangay, code=code)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {'code': 'A hotspot with this code already exists in this barangay.'}
            )

        attrs['name'] = self._build_name(barangay, code)
        return attrs