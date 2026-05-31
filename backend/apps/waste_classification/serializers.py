from rest_framework import serializers
from .models import WasteClassification

class WasteClassificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteClassification
        fields = '__all__'