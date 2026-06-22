from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import WasteClassification

# Starting-point thresholds — tune these once you have real sensor data
# from the field. clog_pct is assumed to be a 0-100 scale.
CLOG_PCT_THRESHOLDS = {
    'High': 80,
    'Medium': 60,
    'Low': 30,
}


def get_severity(clog_pct):
    """Map a clog_pct value to a ClogEvent severity tier, or None if it's
    not high enough to warrant an event at all."""
    if clog_pct is None:
        return None
    if clog_pct >= CLOG_PCT_THRESHOLDS['High']:
        return 'High'
    if clog_pct >= CLOG_PCT_THRESHOLDS['Medium']:
        return 'Medium'
    if clog_pct >= CLOG_PCT_THRESHOLDS['Low']:
        return 'Low'
    return None


@receiver(post_save, sender=WasteClassification)
def create_clog_event_if_needed(sender, instance, created, **kwargs):
    if not created:
        return

    # Deferred import to avoid a circular import: clog_events.models
    # imports WasteClassification, so we only import ClogEvent here,
    # inside the function, not at module load time.
    from apps.clog_events.models import ClogEvent

    # Guard 1: the AI didn't actually see waste — don't open an event
    # just because water level/flow looked off (could be rain).
    if instance.dominant_waste_type == 'None':
        return

    reading = instance.reading
    severity = get_severity(reading.clog_pct)
    if severity is None:
        return

    # Guard 2: don't duplicate — if there's already an unresolved event
    # for this node, this classification is more evidence for the SAME
    # ongoing incident, not a new one.
    already_open = ClogEvent.objects.filter(
        node=instance.node,
        status__in=['Detected', 'Responded']
    ).exists()
    if already_open:
        return

    ClogEvent.objects.create(
        node=instance.node,
        barangay=instance.node.barangay,
        classification=instance,
        severity=severity,
        # status defaults to 'Detected' per the model
    )