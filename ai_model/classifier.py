import tensorflow as tf
import numpy as np
from PIL import Image
import os

# Path to saved model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "saved_model", "waste_classifier.keras")

# Waste categories — must match training order
CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]

# Load model once when the module is imported
print("Loading AGOS waste classification model...")
model = tf.keras.models.load_model(MODEL_PATH)
print("Model loaded successfully!")

def classify_waste(image_path: str) -> dict:
    """
    Classifies waste type from an image.

    Args:
        image_path: Path to the image file

    Returns:
        dict with waste_type and confidence
    """
    try:
        # Open and preprocess image
        img = Image.open(image_path).convert("RGB")
        img = img.resize((224, 224))

        # Convert to array and add batch dimension
        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = model.predict(img_array, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        return {
            "waste_type": CATEGORIES[predicted_index],
            "confidence": round(confidence * 100, 2),
            "success": True
        }

    except Exception as e:
        return {
            "waste_type": None,
            "confidence": 0,
            "success": False,
            "error": str(e)
        }


def classify_waste_from_bytes(image_bytes: bytes) -> dict:
    """
    Classifies waste type from image bytes.
    Used when receiving image directly from ESP32-CAM.

    Args:
        image_bytes: Raw image bytes

    Returns:
        dict with waste_type and confidence
    """
    try:
        import io
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))

        img_array = np.array(img)
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array, verbose=0)
        predicted_index = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))

        return {
            "waste_type": CATEGORIES[predicted_index],
            "confidence": round(confidence * 100, 2),
            "success": True
        }

    except Exception as e:
        return {
            "waste_type": None,
            "confidence": 0,
            "success": False,
            "error": str(e)
        }
