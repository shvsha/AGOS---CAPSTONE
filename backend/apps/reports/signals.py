from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BarangayMonthlyReport, MunicipalMonthlyReport
from apps.barangay.models import Barangay
from django.db.models import Sum

@receiver(post_save, sender=BarangayMonthlyReport)
def check_and_create_municipal_report(sender, instance, created, **kwargs):
    if not created:
        return

    report_month = instance.report_month

    # Total number of barangays in the system
    total_barangays = Barangay.objects.count()

    # How many submitted for this month
    submitted_reports = BarangayMonthlyReport.objects.filter(
        report_month=report_month
    )
    submitted_count = submitted_reports.count()

    # Only create municipal report if ALL barangays submitted
    if submitted_count >= total_barangays:
        totals = submitted_reports.aggregate(
            total_recyclables=Sum('recyclables_kg'),
            total_amount_sold=Sum('amount_sold'),
            total_biodegradable=Sum('biodegradable_kg'),
            total_composting=Sum('composting_kg'),
            total_residual=Sum('residual_waste_kg'),
            total_special=Sum('special_waste_kg'),
            total_clog_events=Sum('clog_events_addressed'),
        )

        MunicipalMonthlyReport.objects.update_or_create(
            report_month=report_month,
            defaults={
                'total_recyclables_kg': totals['total_recyclables'] or 0,
                'total_amount_sold': totals['total_amount_sold'] or 0,
                'total_biodegradable_kg': totals['total_biodegradable'] or 0,
                'total_composting_kg': totals['total_composting'] or 0,
                'total_residual_waste_kg': totals['total_residual'] or 0,
                'total_special_waste_kg': totals['total_special'] or 0,
                'total_barangays_reported': submitted_count,
                'total_clog_events': totals['total_clog_events'] or 0,
                'status': 'Draft',
            }
        )