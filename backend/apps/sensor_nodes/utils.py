from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone


def send_device_key_email(user, node, device_key):
    node_label = node.node_name or f'Node {node.node_id}'
    node_management_url = f'{settings.FRONTEND_URL}/admin/node'

    context = {
        'user': user,
        'node_label': node_label,
        'device_key': device_key,
        'node_management_url': node_management_url,
        'current_year': timezone.now().year,
    }

    subject = f'AGOS Device Key — {node_label}'
    html_message = render_to_string('emails/device_key_email.html', context)

    # Plain-text fallback for clients that block/strip HTML
    text_message = (
        f'A new device key has been generated for {node_label} on AGOS.\n\n'
        f'Node: {node_label}\n'
        f'Device Key: {device_key}\n\n'
        f'This key will not be shown again. Copy it into the device firmware now.\n\n'
        f'Manage nodes here: {node_management_url}'
    )

    email = EmailMultiAlternatives(
        subject,
        text_message,
        settings.EMAIL_HOST_USER,
        [user.email],
    )
    email.attach_alternative(html_message, 'text/html')
    email.send(fail_silently=False)