from django.db import models
from apps.barangay.models import Barangay
from django.conf import settings

class BarangayMonthlyReport(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Reviewed', 'Reviewed'),
        ('Approved', 'Approved'),
    ]

    monthly_report_id = models.AutoField(primary_key=True)
    barangay = models.ForeignKey(
        Barangay,
        on_delete=models.CASCADE,
        db_column='barangay_id'
    )
    municipal_report = models.ForeignKey(
        'MunicipalMonthlyReport',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='municipal_report_id'
    )
    report_month = models.DateField()
    entry_date = models.DateField()
    recyclables_kg = models.FloatField(default=0)
    amount_sold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    biodegradable_kg = models.FloatField(default=0)
    composting_kg = models.FloatField(null=True, blank=True)
    residual_waste_kg = models.FloatField(default=0)
    special_waste_kg = models.FloatField(null=True, blank=True)
    clog_events_addressed = models.IntegerField(default=0)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_reports',
        db_column='submitted_by'
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_reports',
        db_column='verified_by'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')

    class Meta:
        db_table = 'tbl_barangay_monthly_report'
        unique_together = ('barangay', 'report_month')

    def __str__(self):
        return f"Report - {self.barangay.barangay_name} - {self.report_month}"


class ReportMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('Image', 'Image'),
        ('Video', 'Video'),
    ]

    media_id = models.AutoField(primary_key=True)
    monthly_report = models.ForeignKey(
        BarangayMonthlyReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='monthly_report_id'
    )
    clog_event = models.ForeignKey(
        'clog_events.ClogEvent',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column='event_id'
    )
    file_path = models.CharField(max_length=255)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPE_CHOICES)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tbl_report_media'

    def __str__(self):
        return f"Media {self.media_id} - {self.media_type}"


class MunicipalMonthlyReport(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Finalized', 'Finalized'),
    ]

    municipal_report_id = models.AutoField(primary_key=True)
    report_month = models.DateField(unique=True)
    total_recyclables_kg = models.FloatField(default=0)
    total_amount_sold = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_biodegradable_kg = models.FloatField(default=0)
    total_composting_kg = models.FloatField(null=True, blank=True)
    total_residual_waste_kg = models.FloatField(default=0)
    total_special_waste_kg = models.FloatField(null=True, blank=True)
    total_barangays_reported = models.IntegerField(default=0)
    total_clog_events = models.IntegerField(default=0)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        db_column='generated_by'
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Draft')

    class Meta:
        db_table = 'tbl_municipal_monthly_report'

    def __str__(self):
        return f"Municipal Report - {self.report_month}"