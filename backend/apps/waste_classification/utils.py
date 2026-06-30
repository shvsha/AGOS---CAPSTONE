"""
Waste volume/weight estimation utilities.

Implements the formula documented in
"Trash Volume Estimation — AGOS System Notes.txt":

    clog_depth_m      = (sensor_height_cm - water_level_cm) / 100
    waste_thickness_m = BASE_THICKNESS[dominant_waste_type] * (clog_pct / 100)
    volume_m3         = canal_width_m * clog_depth_m * waste_thickness_m
    estimated_kg      = volume_m3 * DENSITY[dominant_waste_type]

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

    clog_depth_m = (sensor_height - water_level) / 100
    if clog_depth_m <= 0:
        # No gap between sensor and water surface (or water above sensor) —
        # no room for waste to accumulate.
        return 0.0

    waste_thickness_m = BASE_THICKNESS[waste_type] * (clog_pct / 100)
    volume_m3 = canal_width * clog_depth_m * waste_thickness_m
    estimated_kg = volume_m3 * DENSITY[waste_type]

    return max(estimated_kg, 0.0)


def max_capacity_kg(canal_width, sensor_height):
    """
    Compute the per-hotspot maximum waste capacity (kg), used as the
    severity reference instead of a flat global constant.

    Same formula as `estimate_weight_kg`, with clog_pct fixed at 100% and
    the worst-case waste type as inputs. Returns None if required hotspot
    dimensions are missing.
    """
    return estimate_weight_kg(
        canal_width=canal_width,
        sensor_height=sensor_height,
        water_level=0,
        clog_pct=100,
        waste_type=WORST_CASE_WASTE_TYPE,
    ) if canal_width is not None and sensor_height is not None else None
