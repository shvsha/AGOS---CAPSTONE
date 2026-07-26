from rest_framework import serializers
from .models import AlertSoundConfig, UploadedAlertSound


class AlertSoundConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertSoundConfig
        fields = ['config_id', 'sound_enabled', 'critical_sound', 'warning_sound', 'info_sound', 'updated_at']
        read_only_fields = ['config_id', 'updated_at']


class UploadedAlertSoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedAlertSound
        fields = ['sound_id', 'original_filename', 'file', 'duration_seconds', 'uploaded_at']