from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'audit_id', 'user', 'user_details',
            'action', 'affected_table',
            'old_value', 'new_value',
            'ip_address', 'timestamp',
        ]

    def get_user_details(self, obj):
        if not obj.user:
            return None
        return {
            'user_id': obj.user.user_id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
            'user_role': obj.user.user_role,
        }