"""
AGOS - test_classifier.py
=========================
Smoke test for classifier.py after training.
Runs a real canal image through the model and prints the full JSON output.

Usage:
  python test_classifier.py path/to/canal_photo.jpg
  python test_classifier.py                          # uses first test image found
"""

import sys
import os
import json

# Add ai_model root to path so classifier.py can find the model
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def find_any_test_image(test_dir="dataset/test"):
    """Find any real image in the test split to use as a default."""
    for root, _, files in os.walk(test_dir):
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                return os.path.join(root, f)
    return None


def main():
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
    else:
        image_path = find_any_test_image()
        if not image_path:
            print("No test image found. Usage: python test_classifier.py <path_to_image>")
            sys.exit(1)
        print(f"No image specified — using: {image_path}\n")

    if not os.path.exists(image_path):
        print(f"Image not found: {image_path}")
        sys.exit(1)

    print(f"Testing classifier with: {image_path}\n")

    from classifier import classify_waste
    result = classify_waste(image_path)

    print("Result from classify_waste():")
    print(json.dumps(result, indent=2))

    if result.get("success"):
        dominant = result["dominant_waste_type"]
        confidence = result["confidence"]
        print(f"\n✅ Prediction: {dominant} ({confidence:.1f}% confidence)")

        if confidence < 50:
            print("⚠  Low confidence — model may need more training data for this category")
        elif confidence >= 80:
            print("   High confidence — model looks solid for this category")
    else:
        print(f"\n❌ Classification failed: {result.get('error')}")
        print("   Check that waste_classifier.keras exists in saved_model/")


if __name__ == "__main__":
    main()
