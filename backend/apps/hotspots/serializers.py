from rest_framework import serializers
from .models import Hotspot
from apps.barangay.models import Barangay


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
            'name', 'description',
            'latitude', 'longitude',
            'canal_width', 'canal_shape', 'sensor_height',
            'is_occupied',
            'created_at', 'updated_at',
        ]
        extra_kwargs = {
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

    def validate(self, attrs):
        barangay = attrs.get('barangay', getattr(self.instance, 'barangay', None))
        name = attrs.get('name', getattr(self.instance, 'name', None))

        qs = Hotspot.objects.filter(barangay=barangay, name=name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {'name': 'A hotspot with this name already exists in this barangay.'}
            )
        return attrs
