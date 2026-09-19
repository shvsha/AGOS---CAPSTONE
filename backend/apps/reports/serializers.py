from rest_framework import serializers
from .models import CanalMonitoringReport, ReportMedia
from apps.barangay.serializers import BarangaySerializer
from apps.users.serializers import UserSerializer


class ReportMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ReportMedia
        fields = '__all__'

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file_path and request:
            return request.build_absolute_uri(obj.file_path.url)
        return None


class CanalMonitoringReportSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)
    media = ReportMediaSerializer(many=True, read_only=True, source='reportmedia_set')
    reported_by_details = UserSerializer(source='reported_by', read_only=True)

    class Meta:
        model = CanalMonitoringReport
        fields = '__all__'
        read_only_fields = ['barangay', 'reported_by']