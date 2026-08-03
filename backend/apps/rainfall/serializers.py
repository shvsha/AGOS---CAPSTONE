from rest_framework import serializers
from .models import RainfallCondition


class RainfallConditionSerializer(serializers.ModelSerializer):
    condition = serializers.CharField(source='effective_condition', read_only=True)

    class Meta:
        model = RainfallCondition
        fields = ['condition', 'updated_at']