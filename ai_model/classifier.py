import tensorflow as tf
import numpy as np
from PIL import Image
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model", "waste_classifier.keras")
CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]

print("Loading AGOS waste classification model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")

def classify_waste(image_path: str) -> dict:
    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        percentages = predictions[0]

        # Build percentage breakdown for all categories
        result = {}
        for i, category in enumerate(CATEGORIES):
            result[category] = round(float(percentages[i]) * 100, 2)

        # Find dominant type
        dominant_index = np.argmax(percentages)
        dominant = CATEGORIES[dominant_index]
        confidence = round(float(percentages[dominant_index]) * 100, 2)

        return {
            "percentages": result,
            "dominant_waste_type": dominant,
            "confidence": confidence,
            "success": True
        }

    except Exception as e:
        return {
            "percentages": {},
            "dominant_waste_type": None,
            "confidence": 0,
            "success": False,
            "error": str(e)
        }


def classify_waste_from_bytes(image_bytes: bytes) -> dict:
    try:
        import io
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        percentages = predictions[0]

        result = {}
        for i, category in enumerate(CATEGORIES):
            result[category] = round(float(percentages[i]) * 100, 2)

        dominant_index = np.argmax(percentages)
        dominant = CATEGORIES[dominant_index]
        confidence = round(float(percentages[dominant_index]) * 100, 2)

        return {
            "percentages": result,
            "dominant_waste_type": dominant,
            "confidence": confidence,
            "success": True
        }

    except Exception as e:
        return {
            "percentages": {},
            "dominant_waste_type": None,
            "confidence": 0,
            "success": False,
            "error": str(e)
        }