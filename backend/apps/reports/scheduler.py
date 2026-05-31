from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django.utils import timezone
from django.db.models import Sum
import calendar
import logging

logger = logging.getLogger(__name__)

def generate_municipal_report():
    from .models import BarangayMonthlyReport, MunicipalMonthlyReport
    
    today = timezone.now().date()

    # Check if today is the last day of the month
    last_day = calendar.monthrange(today.year, today.month)[1]
    if today.day != last_day:
        return

    report_month = today.replace(day=1)

    submitted_reports = BarangayMonthlyReport.objects.filter(
        report_month__year=today.year,
        report_month__month=today.month
    )

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
            'total_barangays_reported': submitted_reports.count(),
            'total_clog_events': totals['total_clog_events'] or 0,
            'status': 'Draft',
        }
    )
    logger.info(f"Municipal report generated for {report_month}")


def start():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")

    scheduler.add_job(
        generate_municipal_report,
        trigger=CronTrigger(hour=23, minute=59),
        id="generate_municipal_report",
        max_instances=1,
        replace_existing=True,
    )

    logger.info("Starting scheduler...")
    scheduler.start()