"""
AGOS - find_bad_images.py
==========================
Scans an image folder (recursively) and flags photos that are likely broken
or placeholder images: near-solid color, very low detail, or unreadable files.

These are the kind of source photos that, once picked up by
augment_dataset.py, produce corrupted-looking "augmented" images (since
transforming a solid-color image still produces a solid-color image).

Usage:
  python find_bad_images.py --dir raw_photos
  python find_bad_images.py --dir dataset/train --std_threshold 10
"""

import argparse
from pathlib import Path
from PIL import Image
import numpy as np

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def scan(root: Path, std_threshold: float):
    flagged = []
    total = 0

    for path in sorted(root.rglob("*")):
        if path.suffix.lower() not in IMAGE_EXTS:
            continue
        total += 1
        try:
            img = Image.open(path).convert("RGB")
            arr = np.array(img)
        except Exception as e:
            flagged.append((path, f"UNREADABLE: {e}"))
            continue

        std = arr.std()
        if std < std_threshold:
            mean_rgb = arr.reshape(-1, 3).mean(axis=0)
            flagged.append(
                (path, f"LOW DETAIL (std={std:.1f}, avg RGB={mean_rgb.round(1).tolist()})")
            )

    return total, flagged


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="raw_photos", help="Folder to scan recursively")
    parser.add_argument(
        "--std_threshold",
        type=float,
        default=10.0,
        help="Pixel std-dev below this = flagged as near-solid-color/broken",
    )
    args = parser.parse_args()

    root = Path(args.dir)
    if not root.exists():
        print(f"Folder not found: {root}")
        return

    total, flagged = scan(root, args.std_threshold)

    print(f"\nScanned {total} images in {root}\n")
    if not flagged:
        print("✅ No suspicious images found.")
    else:
        print(f"⚠ {len(flagged)} suspicious image(s) found:\n")
        for path, reason in flagged:
            print(f"  {path}  →  {reason}")
    print()


if __name__ == "__main__":
    main()
