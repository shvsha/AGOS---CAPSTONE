"""
AGOS AI Service — standalone microservice hosting both waste-classification
models (TensorFlow/MobileNetV2 + YOLO detection), deployed separately from
the main Django backend so the two heavy ML frameworks don't compete with
Django/Channels for the same 512MB memory pool.

Exposes one endpoint: POST /classify
Input:  a single JPEG frame (multipart/form-data, field name "frame")
Output: combined JSON with both models' results, in the same shape the
        Django backend previously computed in-process.

Auth: a shared secret header (X-Service-Key) checked against an env var,
since this service should only ever be called by the Django backend, not
exposed publicly.
"""
import os
import io
import logging

from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.responses import JSONResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AGOS AI Service")

SERVICE_KEY = os.environ.get("AI_SERVICE_KEY")  # shared secret, set on both services


# ------------------------------------------------------------------
# Lazy-loaded models — loaded once on first request, not at import
# time, so the service starts up fast and only pays the loading cost
# when actually needed.
# ------------------------------------------------------------------

_tf_model = None
_tf_load_failed = False

_yolo_model = None
_yolo_load_failed = False

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
MIXED_THRESHOLD = 0.35
TF_MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model", "waste_classifier.keras")

YOLO_MODEL_PATH = os.environ.get(
    "WASTE_DETECTION_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "weights", "waste_yolo.pt"),
)
AVG_WEIGHT_KG = {
    "plastic_bottle": 0.025,
    "paper_cartoon": 0.015,  # NOTE: typo baked into the trained model's class names — keep as-is
    "sachet_wrapper": 0.005,
    "dry_leaves": 0.010,
    "rigid_plastic": 0.010,
    "other": 0.015,
    "glass": 0.150,
}
CONFIDENCE_THRESHOLD = 0.5


def _get_tf_model():
    global _tf_model, _tf_load_failed
    if _tf_model is not None:
        return _tf_model
    if _tf_load_failed:
        return None
    try:
        import tensorflow as tf
        logger.info("Loading AGOS waste classification model...")
        _tf_model = tf.keras.models.load_model(TF_MODEL_PATH)
        logger.info("TensorFlow model loaded successfully!")
        return _tf_model
    except Exception:
        logger.exception("Failed to load TensorFlow model.")
        _tf_load_failed = True
        return None


def _get_yolo_model():
    global _yolo_model, _yolo_load_failed
    if _yolo_model is not None:
        return _yolo_model
    if _yolo_load_failed:
        return None
    if not os.path.exists(YOLO_MODEL_PATH):
        logger.info("YOLO weights not found at %s — skipping detection.", YOLO_MODEL_PATH)
        _yolo_load_failed = True
        return None
    try:
        from ultralytics import YOLO
        _yolo_model = YOLO(YOLO_MODEL_PATH)
        logger.info("YOLO model loaded successfully!")
        return _yolo_model
    except Exception:
        logger.exception("Failed to load YOLO model.")
        _yolo_load_failed = True
        return None


# ------------------------------------------------------------------
# TensorFlow classification (ported from ai_model/classifier.py)
# ------------------------------------------------------------------

def _run_tf_classification(image_bytes: bytes) -> dict:
    model = _get_tf_model()
    if model is None:
        return {
            "percentages": {}, "dominant_waste_type": None, "confidence": 0,
            "is_mixed": False, "present_waste_types": [], "success": False,
            "error": "TensorFlow model unavailable",
        }
    try:
        import numpy as np
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        percentages_raw = predictions[0]

        result = {}
        present = []
        for i, category in enumerate(CATEGORIES):
            pct = round(float(percentages_raw[i]) * 100, 2)
            result[category] = pct
            if float(percentages_raw[i]) >= MIXED_THRESHOLD:
                present.append({"waste_type": category, "percentage": pct})
        present.sort(key=lambda x: x["percentage"], reverse=True)

        dominant_index = int(np.argmax(percentages_raw))
        dominant = CATEGORIES[dominant_index]
        confidence = round(float(percentages_raw[dominant_index]) * 100, 2)

        return {
            "percentages": result,
            "dominant_waste_type": dominant,
            "confidence": confidence,
            "is_mixed": len(present) > 1,
            "present_waste_types": present,
            "success": True,
        }
    except Exception as e:
        logger.exception("TensorFlow classification failed")
        return {
            "percentages": {}, "dominant_waste_type": None, "confidence": 0,
            "is_mixed": False, "present_waste_types": [], "success": False,
            "error": str(e),
        }


# ------------------------------------------------------------------
# YOLO detection-based weight estimate (ported from detection.py)
# ------------------------------------------------------------------

def _run_yolo_detection(image_bytes: bytes):
    model = _get_yolo_model()
    if model is None:
        return None, None
    try:
        import numpy as np
        import cv2

        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            logger.warning("Could not decode frame for detection")
            return None, None

        results = model(img, verbose=False)
        boxes = results[0].boxes
        names = results[0].names

        counts_by_class = {}
        for box in boxes:
            conf = float(box.conf[0])
            if conf < CONFIDENCE_THRESHOLD:
                continue
            class_name = names[int(box.cls[0])]
            counts_by_class[class_name] = counts_by_class.get(class_name, 0) + 1

        estimated_kg = sum(
            count * AVG_WEIGHT_KG.get(class_name, AVG_WEIGHT_KG["other"])
            for class_name, count in counts_by_class.items()
        )
        return estimated_kg, counts_by_class
    except Exception:
        logger.exception("YOLO detection failed")
        return None, None


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@app.get("/healthz")
def healthz():
    """Plain health check for the keep-alive ping — cheap, no model loading."""
    return {"status": "ok"}


@app.post("/classify")
async def classify(
    frame: UploadFile = File(...),
    x_service_key: str = Header(None),
):
    if SERVICE_KEY and x_service_key != SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Invalid service key")

    image_bytes = await frame.read()

    classification_result = _run_tf_classification(image_bytes)
    detected_kg, detected_counts = _run_yolo_detection(image_bytes)

    return JSONResponse({
        "classification": classification_result,
        "detection": {
            "estimated_kg": detected_kg,
            "counts_by_class": detected_counts,
        },
    })