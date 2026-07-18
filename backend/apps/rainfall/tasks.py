import logging
from datetime import datetime

import requests

from apps.barangay.models import Barangay
from .models import RainfallCondition
from .services import mm_per_hour_to_condition

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def fetch_rainfall_for_barangay(barangay):
    """
    Fetches the current hour's precipitation (mm/hr) for one barangay
    from Open-Meteo and updates its RainfallCondition row.
    Returns True on success, False on any failure (logged, not raised —
    one barangay's failure shouldn't stop the rest from updating).
    """
    params = {
        'latitude': barangay.latitude,
        'longitude': barangay.longitude,
        'hourly': 'precipitation',
        'forecast_days': 1,
    }

    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        times = data['hourly']['time']
        values = data['hourly']['precipitation']

        current_hour_str = datetime.now().strftime('%Y-%m-%dT%H:00')

        if current_hour_str in times:
            idx = times.index(current_hour_str)
        else:
            # Fall back to the most recent past hour if the exact
            # current-hour slot isn't in the response yet.
            idx = len(times) - 1
            for i, t in enumerate(times):
                if t <= current_hour_str:
                    idx = i

        mm_per_hour = values[idx]
        condition = mm_per_hour_to_condition(mm_per_hour)

        RainfallCondition.objects.update_or_create(
            barangay=barangay,
            defaults={
                'rainfall_mm_hr': mm_per_hour,
                'condition': condition,
            }
        )
        logger.info(f"Rainfall updated: {barangay.barangay_name} = {mm_per_hour}mm/hr -> {condition}")
        return True

    except Exception as e:
        logger.error(f"Rainfall fetch failed for {barangay.barangay_name}: {e}")
        return False


def fetch_all_barangays():
    barangays = Barangay.objects.filter(is_registered=True)
    for barangay in barangays:
        fetch_rainfall_for_barangay(barangay)