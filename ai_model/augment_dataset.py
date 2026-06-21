"""
AGOS - augment_dataset.py
=========================
Augments the TRAIN split only until each category reaches --target images.
Val and test sets are left untouched (we only evaluate on real photos).

Augmentations applied (canal-appropriate):
  - Horizontal / vertical flip
  - Rotation +-30 deg
  - Brightness / contrast shift (simulates lighting conditions)
  - Zoom in/out +-20%
  - Shear +-15 deg
  - Slight hue shift (murky vs clear water)

Quality safeguard:
  After generating an augmented image, we compare its pixel std-dev against
  the source photo's. If a (random) combination of transforms washed the
  image out into a near-solid color (e.g. brightness + contrast stacking on
  an already green-tinted photo), we discard it and try a different random
  combination instead of saving a degenerate image to disk.

Usage:
  pip install Pillow numpy
  python augment_dataset.py
  python augment_dataset.py --train_dir dataset/train --target 150
"""

import os
import random
import argparse
import math
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import numpy as np

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
IMAGE_EXTS  = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


# ---------------------------------------------------------------------------
# Augmentation primitives
# ---------------------------------------------------------------------------

def _flip_h(img: Image.Image) -> Image.Image:
    return ImageOps.mirror(img)

def _flip_v(img: Image.Image) -> Image.Image:
    return ImageOps.flip(img)

def _rotate(img: Image.Image) -> Image.Image:
    angle = random.uniform(-30, 30)
    return img.rotate(angle, resample=Image.BILINEAR, expand=False)

def _brightness(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.6, 1.5)
    return ImageEnhance.Brightness(img).enhance(factor)

def _contrast(img: Image.Image) -> Image.Image:
    factor = random.uniform(0.7, 1.4)
    return ImageEnhance.Contrast(img).enhance(factor)

def _zoom(img: Image.Image) -> Image.Image:
    """Crop a random portion then resize back to original size."""
    w, h = img.size
    scale = random.uniform(0.80, 1.20)
    new_w, new_h = int(w / scale), int(h / scale)
    new_w = min(new_w, w)
    new_h = min(new_h, h)
    left   = random.randint(0, w - new_w)
    top    = random.randint(0, h - new_h)
    cropped = img.crop((left, top, left + new_w, top + new_h))
    return cropped.resize((w, h), Image.BILINEAR)

def _shear(img: Image.Image) -> Image.Image:
    """Affine shear along x-axis."""
    shear_factor = random.uniform(-0.15, 0.15)
    w, h = img.size
    xshift = abs(shear_factor) * h
    new_w  = int(w + xshift)
    # PIL affine: (a,b,c,d,e,f)
    img = img.transform(
        (new_w, h),
        Image.AFFINE,
        (1, shear_factor, -xshift if shear_factor > 0 else 0, 0, 1, 0),
        resample=Image.BILINEAR,
    )
    return img.resize((w, h), Image.BILINEAR)

def _hue_shift(img: Image.Image) -> Image.Image:
    """Slight hue rotation to simulate water colour variation."""
    img_hsv = img.convert("HSV")
    h_arr, s_arr, v_arr = [np.array(c) for c in img_hsv.split()]
    shift = random.randint(-15, 15)
    h_arr = (h_arr.astype(int) + shift) % 256
    img_shifted = Image.merge("HSV", [Image.fromarray(h_arr.astype(np.uint8)),
                                       Image.fromarray(s_arr),
                                       Image.fromarray(v_arr)])
    return img_shifted.convert("RGB")

# Ordered pool of augmentation functions
AUG_POOL = [_flip_h, _flip_v, _rotate, _brightness, _contrast, _zoom, _shear, _hue_shift]


def augment_image(img: Image.Image, n_transforms: int = 3) -> Image.Image:
    """Apply n_transforms randomly chosen augmentations in sequence."""
    fns = random.sample(AUG_POOL, min(n_transforms, len(AUG_POOL)))
    for fn in fns:
        try:
            img = fn(img)
        except Exception:
            pass  # skip broken transform silently
    return img


# ---------------------------------------------------------------------------
# Quality safeguard
# ---------------------------------------------------------------------------

def is_degenerate(aug_arr: np.ndarray, src_std: float,
                   min_std: float = 15.0, min_ratio: float = 0.25) -> bool:
    """
    Flag an augmented image as degenerate (washed out / near-solid-color)
    if it lost most of its detail compared to the source photo.

    - min_std: absolute floor. Below this std-dev, an image is basically a
      flat color block regardless of what it started as.
    - min_ratio: relative floor. If the augmented image has less than this
      fraction of the source photo's own detail, the transform chain was
      too destructive (e.g. brightness+contrast stacking too hard).
    """
    aug_std = aug_arr.std()
    if aug_std < min_std:
        return True
    if aug_std < src_std * min_ratio:
        return True
    return False


# ---------------------------------------------------------------------------
# Main augmentation loop
# ---------------------------------------------------------------------------

def get_images(folder: Path) -> list[Path]:
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)


def augment_category(train_dir: Path, category: str, target: int, seed: int,
                      max_attempts_per_image: int = 8):
    cat_dir = train_dir / category
    if not cat_dir.exists():
        print(f"  [SKIP] {category}/ not found")
        return

    existing = get_images(cat_dir)
    current  = len(existing)

    if current >= target:
        print(f"  {category:15s}  {current:>4} photos — already at target, skipping")
        return

    needed = target - current
    print(f"  {category:15s}  {current:>4} photos — generating {needed} augmented images...")

    random.seed(seed)
    generated = 0
    rejected  = 0

    while generated < needed:
        src_path = random.choice(existing)
        try:
            img = Image.open(src_path).convert("RGB")
        except Exception as e:
            print(f"    [WARN] Could not open {src_path.name}: {e}")
            continue

        src_std = np.array(img).std()

        # Try a few random transform combos; keep the first good one.
        aug_img = None
        for _attempt in range(max_attempts_per_image):
            n_transforms = random.choice([2, 3, 4])
            candidate = augment_image(img, n_transforms=n_transforms)

            if is_degenerate(np.array(candidate), src_std):
                rejected += 1
                continue

            aug_img = candidate
            break

        if aug_img is None:
            # Every attempt for this source image washed out — fall back to
            # a single mild transform so we still make progress.
            aug_img = _flip_h(img) if random.random() < 0.5 else _rotate(img)

        out_name = f"aug_{generated:05d}{src_path.suffix}"
        out_path = cat_dir / out_name
        aug_img.save(out_path, quality=92)
        generated += 1

    final = len(get_images(cat_dir))
    extra = f"  ({rejected} degenerate attempts rejected)" if rejected else ""
    print(f"    -> {final} total photos in {category}/{extra}")


def run(train_dir: Path, target: int, seed: int):
    print(f"\nAugmenting training set at: {train_dir}")
    print(f"Target per category       : {target}\n")

    for category in CATEGORIES:
        augment_category(train_dir, category, target, seed)

    print("\nAugmentation complete.\n")

    print("Final training counts:")
    for cat in CATEGORIES:
        d = train_dir / cat
        n = len(get_images(d)) if d.exists() else 0
        status = "OK" if n >= target else "LOW"
        print(f"  [{status}] {cat:15s}: {n}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--train_dir", default="dataset/train",
                        help="Path to the train split folder")
    parser.add_argument("--target", type=int, default=150,
                        help="Minimum images per category after augmentation")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility")
    args = parser.parse_args()

    run(Path(args.train_dir), args.target, args.seed)