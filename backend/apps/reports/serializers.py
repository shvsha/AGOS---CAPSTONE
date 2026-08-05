from rest_framework import serializers
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
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

class BarangayMonthlyReportSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)
    media = ReportMediaSerializer(many=True, read_only=True, source='reportmedia_set')
    submitted_by_details = UserSerializer(source='submitted_by', read_only=True)
    verified_by_details = UserSerializer(source='verified_by', read_only=True)

    class Meta:
        model = BarangayMonthlyReport
        fields = '__all__'
        read_only_fields = ['barangay', 'submitted_by']

class MunicipalMonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MunicipalMonthlyReport
        fields = '__all__'