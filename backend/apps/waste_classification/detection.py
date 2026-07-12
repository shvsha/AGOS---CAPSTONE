"""
Item-count-based waste weight estimation using a fine-tuned YOLOv8 model.

This runs ALONGSIDE the existing MobileNetV2 classifier
(`run_waste_classification`) — it does NOT replace it. MobileNetV2 keeps
producing `dominant_waste_type` exactly as before; this module only
replaces *how estimated_kg is computed* (item count x avg weight, instead
of the canal_width x waste_thickness x density geometry formula in
utils.py).

Until a trained model file actually exists at DETECTION_MODEL_PATH, every
function here safely returns None, and callers should fall back to the
existing `estimate_weight_kg` geometry formula. This means dropping this
file in now does not break anything — it only turns on once you've
actually trained and placed a model.

Model expected at: DETECTION_MODEL_PATH (see settings below).
Train it with the yolo_training/ scaffold (see its README.md).

Class list (as of latest field-capture batch, 76 images / 131 tallied
instances) — UPDATE THESE ONCE ROUND 2 (canal-condition photos) IS
LABELED AND THE FINAL CLASS LIST IS LOCKED:
    plastic_bottle, paper_carton, sachet_wrapper, dry_leaves,
    rigid_plastic, other, glass
"""
import os
import logging

logger = logging.getLogger(__name__)

# Where to look for the trained weights. Override via env var if you want
# it configurable per-environment instead of hardcoded here.
DETECTION_MODEL_PATH = os.environ.get(
    'WASTE_DETECTION_MODEL_PATH',
    os.path.join(os.path.dirname(__file__), 'weights', 'waste_yolo.pt'),
)

# Average weight (kg) per detected item class. PLACEHOLDER VALUES — swap
# for something you can defend (weighed samples, or cited references)
# before relying on this for real numbers. Keys MUST match the class
# names in your trained model's data.yaml.
AVG_WEIGHT_KG = {
    'plastic_bottle': 0.025,
    'paper_cartoon':   0.015,  # NOTE: typo baked into this trained model's class
                                # names (labeled "paper_cartoon" in Roboflow by
                                # mistake). Key must match exactly, or lookups
                                # for this class silently fall back to 'other'.
                                # Fix the spelling in Roboflow before round 2's
                                # relabel/retrain, then rename this key back.
    'sachet_wrapper':  0.005,
    'dry_leaves':     0.010,
    'rigid_plastic':  0.010,
    'other':          0.015,
    'glass':          0.150,
}

# Only count detections the model is at least this confident about.
CONFIDENCE_THRESHOLD = 0.5

_model = None          # lazy-loaded singleton
_model_load_failed = False


def _get_model():
    """
    Loads the YOLO model once and reuses it. Returns None (and logs once,
    not on every call) if the weights file doesn't exist yet or the
    `ultralytics` package isn't installed — this is the mechanism that
    makes the fallback-to-geometry-formula behavior automatic.
    """
    global _model, _model_load_failed

    if _model is not None:
        return _model
    if _model_load_failed:
        return None

    if not os.path.exists(DETECTION_MODEL_PATH):
        logger.info(
            "Waste detection model not found at %s — falling back to "
            "geometry-based estimate_weight_kg. This is expected until "
            "you've trained and placed a model.",
            DETECTION_MODEL_PATH,
        )
        _model_load_failed = True
        return None

    try:
        from ultralytics import YOLO
        _model = YOLO(DETECTION_MODEL_PATH)
        logger.info("Loaded waste detection model from %s", DETECTION_MODEL_PATH)
        return _model
    except Exception:
        logger.exception("Failed to load waste detection model — falling back to geometry estimate.")
        _model_load_failed = True
        return None


def estimate_weight_from_detection(frame_bytes):
    """
    Runs detection on a single raw JPEG frame (the same frame_1 bytes
    already used for MobileNetV2 classification — no new capture needed).

    Returns (estimated_kg, counts_by_class) on success, or (None, None)
    if no model is available yet or detection fails — callers should
    treat None as "fall back to estimate_weight_kg".
    """
    model = _get_model()
    if model is None:
        return None, None

    try:
        import numpy as np
        import cv2

        arr = np.frombuffer(frame_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            logger.warning("Could not decode frame for detection")
            return None, None

        results = model(img, verbose=False)
        boxes = results[0].boxes
        names = results[0].names  # class_id -> class_name, from the model itself

        counts_by_class = {}
        for box in boxes:
            conf = float(box.conf[0])
            if conf < CONFIDENCE_THRESHOLD:
                continue
            class_name = names[int(box.cls[0])]
            counts_by_class[class_name] = counts_by_class.get(class_name, 0) + 1

        estimated_kg = sum(
            count * AVG_WEIGHT_KG.get(class_name, AVG_WEIGHT_KG['other'])
            for class_name, count in counts_by_class.items()
        )

        return estimated_kg, counts_by_class

    except Exception:
        logger.exception("Detection-based weight estimation failed — falling back to geometry estimate.")
        return None, None