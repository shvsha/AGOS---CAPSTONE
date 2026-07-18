from apps.rainfall.models import RainfallCondition, AlertThreshold

RAINFALL_BANDS = [
    (0,    7.5,  'None'),
    (7.5,  15,   'Yellow'),
    (15,   30,   'Orange'),
    (30,   float('inf'), 'Red'),
]

def mm_per_hour_to_condition(mm_per_hour):
    for lower, upper, condition in RAINFALL_BANDS:
        if lower <= mm_per_hour < upper:
            return condition
    return 'None'


def get_effective_condition(barangay):
    """
    Returns the barangay's current rainfall tier, already accounting
    for staleness. Falls back to 'Unknown' if the barangay has no
    RainfallCondition row at all (e.g. registered but never fetched yet).
    """
    try:
        return barangay.rainfall_condition.effective_condition
    except RainfallCondition.DoesNotExist:
        return 'Unknown'


def get_thresholds(condition):
    """
    Returns (warning_pct, critical_pct) for a given condition.
    Falls back to the 'None' tier's thresholds if the requested
    condition somehow has no row — this should never happen given the
    seed migration, but ingestion should never hard-crash on a missing
    threshold row.
    """
    try:
        threshold = AlertThreshold.objects.get(condition=condition)
    except AlertThreshold.DoesNotExist:
        threshold = AlertThreshold.objects.get(condition='None')
    return threshold.warning_pct, threshold.critical_pct


def classify_water_level(water_level, canal_depth, barangay):
    """
    Classifies a water level reading into Normal / Warning / Critical,
    using the barangay's live rainfall tier to pick the right
    threshold pair.

    Returns a dict with the classification plus the inputs that
    produced it, so callers can log/store the full context (useful
    for defense Q&A — "why was this reading classified this way").
    """
    condition = get_effective_condition(barangay)
    warning_pct, critical_pct = get_thresholds(condition)

    pct = (water_level / canal_depth) * 100

    if pct >= critical_pct:
        status = 'Critical'
    elif pct >= warning_pct:
        status = 'Warning'
    else:
        status = 'Normal'

    return {
        'status': status,
        'pct': pct,
        'condition': condition,
        'warning_pct': warning_pct,
        'critical_pct': critical_pct,
    }