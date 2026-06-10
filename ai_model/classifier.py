import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model", "waste_classifier.keras")
CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]

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
    """Build the result dict from model predictions."""
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