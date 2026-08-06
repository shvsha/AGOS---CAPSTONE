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
        read_only_fields = ['barangay', 'submitted_by', 'recyclables_kg', 'amount_sold']

    def _compute_recyclables(self, data):
        return (
            data.get('bote_kg', 0) + data.get('bakal_kg', 0) + data.get('papel_kg', 0)
            + data.get('plastic_kg', 0) + data.get('karton_kg', 0)
        )

    def _compute_amount_sold(self, data):
        return (
            (data.get('amount_sold_bote_plastic') or 0)
            + (data.get('amount_sold_bakal') or 0)
            + (data.get('amount_sold_papel_karton') or 0)
        )

    def create(self, validated_data):
        validated_data['recyclables_kg'] = self._compute_recyclables(validated_data)
        validated_data['amount_sold'] = self._compute_amount_sold(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        merged = {
            'bote_kg': validated_data.get('bote_kg', instance.bote_kg),
            'bakal_kg': validated_data.get('bakal_kg', instance.bakal_kg),
            'papel_kg': validated_data.get('papel_kg', instance.papel_kg),
            'plastic_kg': validated_data.get('plastic_kg', instance.plastic_kg),
            'karton_kg': validated_data.get('karton_kg', instance.karton_kg),
            'amount_sold_bote_plastic': validated_data.get('amount_sold_bote_plastic', instance.amount_sold_bote_plastic),
            'amount_sold_bakal': validated_data.get('amount_sold_bakal', instance.amount_sold_bakal),
            'amount_sold_papel_karton': validated_data.get('amount_sold_papel_karton', instance.amount_sold_papel_karton),
        }
        validated_data['recyclables_kg'] = self._compute_recyclables(merged)
        validated_data['amount_sold'] = self._compute_amount_sold(merged)
        return super().update(instance, validated_data)

class MunicipalMonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MunicipalMonthlyReport
        fields = '__all__'