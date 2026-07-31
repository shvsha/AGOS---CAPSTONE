from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from xhtml2pdf import pisa


def render_to_pdf(report_title, columns, rows, accent_color, generated_by,
                   orientation="portrait", filename="report.pdf"):
    html = render_to_string("exports/base_report.html", {
        "report_title": report_title,
        "columns": columns,
        "rows": rows,
        "accent_color": accent_color,
        "generated_by": generated_by,
        "generated_at": timezone.now().strftime("%b %d, %Y %I:%M %p"),
        "row_count": len(rows),
        "orientation": orientation,
    })

    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'

    pisa_status = pisa.CreatePDF(html, dest=response)
    if pisa_status.err:
        return HttpResponse("PDF generation failed", status=500)
    return response