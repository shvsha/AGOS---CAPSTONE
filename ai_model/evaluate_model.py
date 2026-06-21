"""
AGOS - evaluate_model.py
========================
Run this after training to evaluate waste_classifier.keras on the test set.
Prints per-class precision, recall, F1, and shows the confusion matrix.

Usage:
  python evaluate_model.py
  python evaluate_model.py --model saved_model/waste_classifier.keras --test dataset/test
"""

import os
import argparse
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
IMG_SIZE   = (224, 224)
BATCH_SIZE = 32


def evaluate(model_path: str, test_dir: str):
    import tensorflow as tf
    from sklearn.metrics import classification_report, confusion_matrix

    print(f"Loading model : {model_path}")
    model = tf.keras.models.load_model(model_path)

    datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255.0)
    test_gen = datagen.flow_from_directory(
        test_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CATEGORIES,
        shuffle=False,
    )

    print(f"Test samples  : {test_gen.n}\n")

    test_gen.reset()
    y_pred_probs = model.predict(test_gen, verbose=1)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes[:len(y_pred)]

    print("\n" + "="*60)
    print("Classification Report")
    print("="*60)
    print(classification_report(y_true, y_pred, target_names=CATEGORIES, digits=3))

    # --- Per-class accuracy ---
    cm = confusion_matrix(y_true, y_pred)
    per_class_acc = cm.diagonal() / cm.sum(axis=1)
    print("Per-class accuracy:")
    for i, cat in enumerate(CATEGORIES):
        bar = "█" * int(per_class_acc[i] * 20)
        print(f"  {cat:15s}: {per_class_acc[i]*100:5.1f}%  {bar}")

    overall_acc = np.mean(y_pred == y_true)
    print(f"\nOverall accuracy: {overall_acc*100:.2f}%")

    target_met = overall_acc >= 0.90
    print(f"90% target    : {'✅ MET' if target_met else '⚠ NOT YET — see low-recall classes above'}")

    # --- Confusion matrix plot ---
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=CATEGORIES, yticklabels=CATEGORIES, ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("AGOS Waste Classifier — Confusion Matrix")
    plt.tight_layout()

    out_path = os.path.join(os.path.dirname(model_path), "confusion_matrix_eval.png")
    plt.savefig(out_path, dpi=150)
    print(f"\nConfusion matrix saved: {out_path}")

    # --- What to do if below 90% ---
    if not target_met:
        print("\nTips to improve:")
        low = [(CATEGORIES[i], per_class_acc[i]) for i in range(len(CATEGORIES))
               if per_class_acc[i] < 0.85]
        for cat, acc in sorted(low, key=lambda x: x[1]):
            print(f"  • {cat} ({acc*100:.1f}%) — collect more real photos "
                  f"or increase augmentation multiplier")
        print("  • Consider lowering LR_P2 and running more Phase 2 epochs")
        print("  • Check if special_waste / none images have mislabels")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="saved_model/waste_classifier.keras")
    parser.add_argument("--test",  default="dataset/test")
    args = parser.parse_args()

    evaluate(args.model, args.test)
