from rest_framework import serializers
from .models import BackupConfig, BackupLog


class BackupConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = BackupConfig
        fields = ['config_id', 'auto_backup_enabled', 'frequency', 'server_backup_path', 'updated_at']
        read_only_fields = ['config_id', 'updated_at']


class BackupLogSerializer(serializers.ModelSerializer):
    triggered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BackupLog
        fields = ['log_id', 'backup_type', 'status', 'triggered_by_name', 'file_name', 'error_message', 'created_at']

    def get_triggered_by_name(self, obj):
        if obj.triggered_by:
            return f"{obj.triggered_by.first_name} {obj.triggered_by.last_name}"
        return "System (scheduled)"