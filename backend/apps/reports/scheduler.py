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

    last_day = calendar.monthrange(today.year, today.month)[1]
    if today.day != last_day:
        return

    report_month = today.replace(day=1)

    submitted_reports = BarangayMonthlyReport.objects.filter(
        report_month__year=today.year,
        report_month__month=today.month
    )

    totals = submitted_reports.aggregate(
        total_bote=Sum('bote_kg'),
        total_bakal=Sum('bakal_kg'),
        total_papel=Sum('papel_kg'),
        total_plastic=Sum('plastic_kg'),
        total_karton=Sum('karton_kg'),
        total_amount_sold=Sum('amount_sold'),
        total_biodegradable=Sum('biodegradable_kg'),
        total_residual=Sum('residual_waste_kg'),
        total_special=Sum('special_waste_kg'),
    )

    MunicipalMonthlyReport.objects.update_or_create(
        report_month=report_month,
        defaults={
            'total_bote_kg': totals['total_bote'] or 0,
            'total_bakal_kg': totals['total_bakal'] or 0,
            'total_papel_kg': totals['total_papel'] or 0,
            'total_plastic_kg': totals['total_plastic'] or 0,
            'total_karton_kg': totals['total_karton'] or 0,
            'total_amount_sold': totals['total_amount_sold'] or 0,
            'total_biodegradable_kg': totals['total_biodegradable'] or 0,
            'total_residual_waste_kg': totals['total_residual'] or 0,
            'total_special_waste_kg': totals['total_special'] or 0,
            'total_barangays_reported': submitted_reports.count(),
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