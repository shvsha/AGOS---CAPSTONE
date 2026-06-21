"""
AGOS - review_misclassified.py
================================
Runs the trained model against the test set and copies every misclassified
image into a review/ folder, organized by what it actually was vs what the
model guessed — so you can eyeball the failure cases directly instead of
just reading numbers off a confusion matrix.

Output structure:
  review/
    <actual>_predicted_as_<predicted>/
      conf<NN>_<original_filename>.jpg

The "confNN" prefix is the model's confidence (%) in its wrong guess.
High-confidence wrong guesses are the most concerning ones — those mean the
model is confidently learning the wrong pattern, not just unsure.

Usage:
  python review_misclassified.py
  python review_misclassified.py --test_dir dataset/test --model saved_model/waste_classifier.keras
"""

import shutil
import argparse
from pathlib import Path
import numpy as np
import tensorflow as tf

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
IMG_SIZE = (224, 224)
BATCH_SIZE = 32


def run(test_dir: Path, model_path: Path, out_dir: Path):
    print(f"Loading model from {model_path} ...")
    model = tf.keras.models.load_model(model_path)

    datagen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255.0)
    gen = datagen.flow_from_directory(
        test_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CATEGORIES,
        shuffle=False,
    )

    print("Running predictions...")
    probs = model.predict(gen, verbose=1)
    y_pred = np.argmax(probs, axis=1)
    y_true = gen.classes
    filepaths = gen.filepaths

    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    n_wrong = 0
    for i, (true_idx, pred_idx) in enumerate(zip(y_true, y_pred)):
        if true_idx == pred_idx:
            continue
        n_wrong += 1
        actual = CATEGORIES[true_idx]
        predicted = CATEGORIES[pred_idx]
        confidence = probs[i][pred_idx] * 100

        dest_folder = out_dir / f"{actual}_predicted_as_{predicted}"
        dest_folder.mkdir(parents=True, exist_ok=True)

        src_path = Path(filepaths[i])
        dest_name = f"conf{confidence:.0f}_{src_path.name}"
        shutil.copy2(src_path, dest_folder / dest_name)

    total = len(y_true)
    print(f"\n{n_wrong}/{total} test images misclassified ({n_wrong/total*100:.1f}%)")
    print(f"Copied into: {out_dir}/\n")

    print("Breakdown by confusion type (sorted by count):")
    folders = sorted(
        out_dir.iterdir(),
        key=lambda f: len(list(f.glob("*"))),
        reverse=True,
    ) if out_dir.exists() else []
    for f in folders:
        count = len(list(f.glob("*")))
        print(f"  {f.name:40s} {count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--test_dir", default="dataset/test",
                        help="Path to the test split folder")
    parser.add_argument("--model", default="saved_model/waste_classifier.keras",
                        help="Path to the trained .keras model")
    parser.add_argument("--out_dir", default="review",
                        help="Where to copy misclassified images")
    args = parser.parse_args()

    run(Path(args.test_dir), Path(args.model), Path(args.out_dir))
