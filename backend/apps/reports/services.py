from django.db.models import Sum
from .models import BarangayMonthlyReport, MunicipalMonthlyReport


def sync_municipal_report(report_month, generated_by=None):
    """
    Recomputes the MunicipalMonthlyReport for `report_month` from every
    currently-Reviewed BarangayMonthlyReport in that same month.

    Safe to call repeatedly — always recalculates from scratch rather than
    incrementing, so it self-corrects if a report is edited after being
    verified, or if a barangay's status ever moves back off Reviewed.

    `generated_by`, when given, is stamped as the user whose verification
    action triggered this sync — effectively "who's responsible for the
    current numbers", shown as "Verified By" on the municipal reports list.
    """
    reviewed = BarangayMonthlyReport.objects.filter(
        report_month=report_month, status='Reviewed'
    )

    totals = reviewed.aggregate(
        total_bote_kg=Sum('bote_kg'),
        total_bakal_kg=Sum('bakal_kg'),
        total_papel_kg=Sum('papel_kg'),
        total_plastic_kg=Sum('plastic_kg'),
        total_karton_kg=Sum('karton_kg'),
        total_biodegradable_kg=Sum('biodegradable_kg'),
        total_residual_waste_kg=Sum('residual_waste_kg'),
        total_special_waste_kg=Sum('special_waste_kg'),
        total_amount_sold=Sum('amount_sold'),
    )

    municipal_report, _ = MunicipalMonthlyReport.objects.get_or_create(
        report_month=report_month
    )

    municipal_report.total_bote_kg = totals['total_bote_kg'] or 0
    municipal_report.total_bakal_kg = totals['total_bakal_kg'] or 0
    municipal_report.total_papel_kg = totals['total_papel_kg'] or 0
    municipal_report.total_plastic_kg = totals['total_plastic_kg'] or 0
    municipal_report.total_karton_kg = totals['total_karton_kg'] or 0
    municipal_report.total_biodegradable_kg = totals['total_biodegradable_kg'] or 0
    municipal_report.total_residual_waste_kg = totals['total_residual_waste_kg'] or 0
    municipal_report.total_special_waste_kg = totals['total_special_waste_kg']
    municipal_report.total_amount_sold = totals['total_amount_sold']
    municipal_report.total_barangays_reported = reviewed.count()

    if generated_by is not None:
        municipal_report.generated_by = generated_by

    municipal_report.save()
    return municipal_report