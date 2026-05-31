from rest_framework import serializers
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
from apps.barangay.serializers import BarangaySerializer

class ReportMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportMedia
        fields = '__all__'

class BarangayMonthlyReportSerializer(serializers.ModelSerializer):
    barangay_details = BarangaySerializer(source='barangay', read_only=True)
    media = ReportMediaSerializer(many=True, read_only=True, source='reportmedia_set')

    class Meta:
        model = BarangayMonthlyReport
        fields = '__all__'

class MunicipalMonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MunicipalMonthlyReport
        fields = '__all__'