"""
AGOS - prepare_dataset.py
=========================
Copies raw photos from a source folder into the train/validation/test split structure.

Expected source layout:
  raw_photos/
    biodegradable/   (all your real canal photos)
    recyclable/
    residual/
    special_waste/
    none/

Output layout (created automatically):
  dataset/
    train/  validation/  test/
      biodegradable/ recyclable/ residual/ special_waste/ none/

Split: 70% train / 20% validation / 10% test  (stratified per category)

Usage:
  python prepare_dataset.py
  python prepare_dataset.py --src raw_photos --dst dataset
"""

import os
import shutil
import random
import argparse
from pathlib import Path

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
SPLITS = {"train": 0.70, "validation": 0.20, "test": 0.10}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

def get_images(folder: Path) -> list[Path]:
    return sorted(
        p for p in folder.iterdir()
        if p.suffix.lower() in IMAGE_EXTS
    )

def prepare(src_root: Path, dst_root: Path, seed: int = 42):
    random.seed(seed)

    print(f"\nSource : {src_root}")
    print(f"Output : {dst_root}\n")

    total_copied = 0

    for category in CATEGORIES:
        src_cat = src_root / category
        if not src_cat.exists():
            print(f"  [SKIP] {category}/ not found in source — skipping")
            continue

        images = get_images(src_cat)
        if not images:
            print(f"  [SKIP] {category}/ is empty — skipping")
            continue

        random.shuffle(images)
        n = len(images)

        n_train = int(n * SPLITS["train"])
        n_val   = int(n * SPLITS["validation"])
        # test gets the remainder so rounding never loses a photo
        n_test  = n - n_train - n_val

        buckets = {
            "train":      images[:n_train],
            "validation": images[n_train : n_train + n_val],
            "test":       images[n_train + n_val :],
        }

        print(f"  {category:15s}  total={n:>4}  "
              f"train={n_train:>4}  val={n_val:>3}  test={n_test:>3}")

        for split, files in buckets.items():
            dst_dir = dst_root / split / category
            dst_dir.mkdir(parents=True, exist_ok=True)

            for src_file in files:
                dst_file = dst_dir / src_file.name
                # avoid clobbering if re-run
                if dst_file.exists():
                    stem = src_file.stem
                    dst_file = dst_dir / f"{stem}_dup{src_file.suffix}"
                shutil.copy2(src_file, dst_file)
                total_copied += 1

    print(f"\n✅ Done — {total_copied} photos copied into {dst_root}/\n")

    # Print folder summary
    for split in ["train", "validation", "test"]:
        counts = []
        for cat in CATEGORIES:
            d = dst_root / split / cat
            n = len(get_images(d)) if d.exists() else 0
            counts.append(f"{cat}={n}")
        print(f"  {split:11s}: {', '.join(counts)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="raw_photos",
                        help="Folder containing per-category subfolders of raw images")
    parser.add_argument("--dst", default="dataset",
                        help="Output dataset root (will be created)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducible splits")
    args = parser.parse_args()

    prepare(Path(args.src), Path(args.dst), seed=args.seed)