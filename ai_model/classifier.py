import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model", "waste_classifier.keras")
CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]

# ------------------------------------------------------------------
# Mixed-waste threshold (Option A — defensive stopgap)
#
# Any category whose softmax percentage clears this bar gets included
# in the "present_waste_types" list. 35% is intentionally strict to
# avoid flagging leftover softmax uncertainty as a real waste type.
#
# Known limitation: "recyclable" in particular tends to absorb
# uncertainty from other categories, so treat any recyclable flag
# that sits close to this threshold with extra skepticism until more
# pure recyclable training data is collected.
#
# Raise this value if you're seeing too many false "mixed" reports
# in real-world testing. Lower it only after verifying on real images.
# ------------------------------------------------------------------
MIXED_THRESHOLD = 0.35


print("Loading AGOS waste classification model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")


def _preprocess(img: Image.Image) -> np.ndarray:
    """Resize, normalize, and batch the image for model input."""
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    img_array = img_array / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array


def _build_result(predictions) -> dict:
    """Build the standard single-label result dict from model predictions."""
    percentages = predictions[0]

    result = {}
    for i, category in enumerate(CATEGORIES):
        result[category] = round(float(percentages[i]) * 100, 2)

    dominant_index = int(np.argmax(percentages))
    dominant       = CATEGORIES[dominant_index]
    confidence     = round(float(percentages[dominant_index]) * 100, 2)

    return {
        "percentages": result,
        "dominant_waste_type": dominant,
        "confidence": confidence,
        "success": True
    }


def _build_mixed_result(predictions) -> dict:
    """
    Build a mixed-waste result dict from model predictions.

    Same percentages as _build_result, but also includes:
    - present_waste_types: list of categories that cleared MIXED_THRESHOLD
    - is_mixed: True if more than one category cleared the threshold

    If only the dominant category clears the threshold (i.e. the model
    is confidently single-label), is_mixed will be False and
    present_waste_types will have just one entry — so this function is
    safe to use as a drop-in replacement for _build_result if you want
    one unified function for both cases.
    """
    percentages = predictions[0]

    result = {}
    present = []
    for i, category in enumerate(CATEGORIES):
        pct = round(float(percentages[i]) * 100, 2)
        result[category] = pct
        if float(percentages[i]) >= MIXED_THRESHOLD:
            present.append({
                "waste_type": category,
                "percentage": pct,
            })

    # Sort present types by percentage descending so dominant is always first
    present.sort(key=lambda x: x["percentage"], reverse=True)

    dominant_index = int(np.argmax(percentages))
    dominant       = CATEGORIES[dominant_index]
    confidence     = round(float(percentages[dominant_index]) * 100, 2)

    return {
        "percentages": result,
        "dominant_waste_type": dominant,
        "confidence": confidence,
        "is_mixed": len(present) > 1,
        "present_waste_types": present,
        "success": True
    }


# ------------------------------------------------------------------
# Original single-label functions — untouched, nothing breaks
# ------------------------------------------------------------------

def classify_waste(image_path: str) -> dict:
    """Classify waste from an image file path."""
    try:
        img = Image.open(image_path).convert("RGB")
        img_array = _preprocess(img)
        predictions = model.predict(img_array, verbose=0)
        return _build_result(predictions)

    except Exception as e:
        return {"percentages": {}, "dominant_waste_type": None, "confidence": 0, "success": False, "error": str(e)}


def classify_waste_from_bytes(image_bytes: bytes) -> dict:
    """Classify waste from raw image bytes (used by Django view — no temp file needed)."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = _preprocess(img)
        predictions = model.predict(img_array, verbose=0)
        return _build_result(predictions)

    except Exception as e:
        return {"percentages": {}, "dominant_waste_type": None, "confidence": 0, "success": False, "error": str(e)}


# ------------------------------------------------------------------
# New mixed-waste functions
# ------------------------------------------------------------------

def classify_mixed(image_path: str) -> dict:
    """
    Classify waste from an image file path, returning all waste types
    that clear the MIXED_THRESHOLD alongside the dominant type.
    """
    try:
        img = Image.open(image_path).convert("RGB")
        img_array = _preprocess(img)
        predictions = model.predict(img_array, verbose=0)
        return _build_mixed_result(predictions)

    except Exception as e:
        return {
            "percentages": {},
            "dominant_waste_type": None,
            "confidence": 0,
            "is_mixed": False,
            "present_waste_types": [],
            "success": False,
            "error": str(e),
        }


def classify_mixed_from_bytes(image_bytes: bytes) -> dict:
    """
    Classify waste from raw image bytes, returning all waste types
    that clear the MIXED_THRESHOLD alongside the dominant type.
    Used by the Django view — no temp file needed.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = _preprocess(img)
        predictions = model.predict(img_array, verbose=0)
        return _build_mixed_result(predictions)

    except Exception as e:
        return {
            "percentages": {},
            "dominant_waste_type": None,
            "confidence": 0,
            "is_mixed": False,
            "present_waste_types": [],
            "success": False,
            "error": str(e),
        }