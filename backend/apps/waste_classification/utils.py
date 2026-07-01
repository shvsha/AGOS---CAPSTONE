"""
Waste volume/weight estimation utilities.

    waste_thickness_m = BASE_THICKNESS[dominant_waste_type] * (clog_pct / 100)
    volume_m3         = canal_width_m * waste_thickness_m
    estimated_kg      = volume_m3 * DENSITY[dominant_waste_type]

`sensor_height`/`water_level` are only used to check that there's physical
room for waste to sit (sensor above the water line) — they no longer
multiply into the volume. Using that vertical sensor-to-water gap as a
footprint multiplier used to inflate estimates for hotspots with a tall
sensor mount, regardless of how much waste was actually visible in frame.

`max_capacity_kg` uses the same formula with clog_pct fixed at 100% and the
worst-case waste type ("Special Waste") so the severity ceiling stays
mathematically consistent with the actual estimate.
"""

# Base waste layer thickness (meters) per dominant waste type.
BASE_THICKNESS = {
    "Recyclable": 0.03,
    "Biodegradable": 0.06,
    "Residual": 0.05,
    "Special Waste": 0.08,
}

# Density (kg/m^3) per dominant waste type.
DENSITY = {
    "Recyclable": 150,
    "Biodegradable": 200,
    "Residual": 300,
    "Special Waste": 400,
}

# Worst-case waste type used for the capacity ceiling: highest base
# thickness AND highest density.
WORST_CASE_WASTE_TYPE = "Special Waste"


def _raw_estimate_kg(canal_width, clog_pct, waste_type):
    """Core formula, no validation/clamping. Internal use only."""
    waste_thickness_m = BASE_THICKNESS[waste_type] * (clog_pct / 100)
    volume_m3 = canal_width * waste_thickness_m
    return volume_m3 * DENSITY[waste_type]


def estimate_weight_kg(canal_width, sensor_height, water_level, clog_pct, waste_type):
    """
    Estimate the weight (kg) of waste accumulated at a hotspot.

    Returns None (never raises) if any required input is missing/None or if
    `waste_type` isn't a recognized key in the lookup tables.
    """
    if canal_width is None or sensor_height is None or water_level is None or clog_pct is None:
        return None

    if waste_type not in BASE_THICKNESS or waste_type not in DENSITY:
        return None

    # Defensive clamp in case clog_pct drifts above 100 elsewhere in the pipeline.
    clog_pct = min(clog_pct, 100)
    if clog_pct < 0:
        clog_pct = 0

    # sensor_height/water_level only gate *whether* there's room for waste
    # (sensor above the water line) — they don't multiply into the volume.
    clog_depth_m = (sensor_height - water_level) / 100
    if clog_depth_m <= 0:
        return 0.0

    estimated_kg = _raw_estimate_kg(canal_width, clog_pct, waste_type)

    # Defensive ceiling: never report more than the hotspot could
    # physically hold, even if upstream inputs drift.
    cap = _raw_estimate_kg(canal_width, 100, WORST_CASE_WASTE_TYPE)
    estimated_kg = min(estimated_kg, cap)

    return max(estimated_kg, 0.0)


def max_capacity_kg(canal_width, sensor_height):
    """
    Compute the per-hotspot maximum waste capacity (kg), used as the
    severity reference instead of a flat global constant.

    Same formula as `estimate_weight_kg`, with clog_pct fixed at 100% and
    the worst-case waste type. Returns None if required hotspot dimensions
    are missing.
    """
    if canal_width is None or sensor_height is None:
        return None
    return _raw_estimate_kg(canal_width, 100, WORST_CASE_WASTE_TYPE)