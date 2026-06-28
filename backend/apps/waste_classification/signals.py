from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WasteClassification


@receiver(post_save, sender=WasteClassification)
def link_classification_to_clog_event(sender, instance, created, **kwargs):
    if not created:
        return

    from apps.clog_events.models import ClogEvent

    # Find the most recent open ClogEvent for this node
    # that doesn't have a classification linked yet
    open_event = ClogEvent.objects.filter(
        node=instance.node,
        status__in=['Detected', 'Responded'],
        classification__isnull=True
    ).order_by('-detected_at').first()

    if open_event:
        open_event.classification = instance
        open_event.save()