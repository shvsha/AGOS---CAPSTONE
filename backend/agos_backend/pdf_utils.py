import base64
import os
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from xhtml2pdf import pisa

_LOGO_DATA_URI = None


def get_logo_data_uri():
    """Base64-encodes the Rosario seal once and caches it in memory."""
    global _LOGO_DATA_URI
    if _LOGO_DATA_URI is None:
        logo_path = os.path.join(os.path.dirname(__file__), "assets", "ros-logo.jpg")
        with open(logo_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode("utf-8")
        _LOGO_DATA_URI = f"data:image/jpeg;base64,{encoded}"
    return _LOGO_DATA_URI


def render_to_pdf(report_title, columns, rows, generated_by,
                   orientation="portrait", filename="report.pdf"):
    html = render_to_string("exports/base_report.html", {
        "report_title": report_title,
        "columns": columns,
        "rows": rows,
        "generated_by": generated_by,
        "generated_at": timezone.now().strftime("%b %d, %Y %I:%M %p"),
        "row_count": len(rows),
        "orientation": orientation,
        "logo_data_uri": get_logo_data_uri(),
    })

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
        return HttpResponse("PDF generation failed", status=500)
    return response


def render_custom_pdf(template_name, context, filename="report.pdf"):
    """
    For exports that need a fully custom layout (not the generic
    columns/rows table) — e.g. barangay/municipal MRF reports.
    """
    html = render_to_string(template_name, context)

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
        return HttpResponse("PDF generation failed", status=500)
    return response