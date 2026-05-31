from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import BarangayMonthlyReport, ReportMedia, MunicipalMonthlyReport
from .serializers import ( BarangayMonthlyReportSerializer, ReportMediaSerializer, MunicipalMonthlyReportSerializer )

class BarangayMonthlyReportListView(generics.ListCreateAPIView):
    serializer_class = BarangayMonthlyReportSerializer

    def get_queryset(self):
        user = self.request.user
        if user.user_role == 'Barangay':
            return BarangayMonthlyReport.objects.filter(
                barangay=user.barangay
            ).order_by('-submitted_at')
        return BarangayMonthlyReport.objects.all().order_by('-submitted_at')

class BarangayMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BarangayMonthlyReport.objects.all()
    serializer_class = BarangayMonthlyReportSerializer
    lookup_field = 'monthly_report_id'

class ReportMediaListView(generics.ListCreateAPIView):
    queryset = ReportMedia.objects.all()
    serializer_class = ReportMediaSerializer

class MunicipalMonthlyReportListView(generics.ListCreateAPIView):
    queryset = MunicipalMonthlyReport.objects.all().order_by('-generated_at')
    serializer_class = MunicipalMonthlyReportSerializer

class MunicipalMonthlyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MunicipalMonthlyReport.objects.all()
    serializer_class = MunicipalMonthlyReportSerializer
    lookup_field = 'municipal_report_id'
