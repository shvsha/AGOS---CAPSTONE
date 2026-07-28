"""
AGOS - convert_heic.py
========================
Converts all .heic images inside raw_photos/<category>/ to .jpg, in place.
The original .heic is removed only after its .jpg conversion succeeds, so
nothing is ever lost mid-run.

Requires: pip install pillow-heif

Usage:
  python convert_heic.py
  python convert_heic.py --dir raw_photos
"""

import argparse
from pathlib import Path

try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    print("Missing dependency. Run:  pip install pillow-heif")
    raise SystemExit(1)

from PIL import Image

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]


def convert(root: Path):
    total_converted = 0
    total_failed = 0

    for cat in CATEGORIES:
        cat_dir = root / cat
        if not cat_dir.exists():
            continue

        heic_files = sorted(cat_dir.glob("*.heic")) + sorted(cat_dir.glob("*.HEIC"))
        if not heic_files:
            continue

        print(f"{cat}: converting {len(heic_files)} .heic file(s)...")
        converted_here = 0

        for heic_path in heic_files:
            jpg_path = heic_path.with_suffix(".jpg")
            if jpg_path.exists():
                jpg_path = heic_path.with_name(heic_path.stem + "_conv.jpg")

            try:
                img = Image.open(heic_path).convert("RGB")
                img.save(jpg_path, "JPEG", quality=92)
                heic_path.unlink()  # only delete original after successful save
                converted_here += 1
            except Exception as e:
                print(f"  [WARN] Failed to convert {heic_path.name}: {e}")
                total_failed += 1

        print(f"  -> {converted_here}/{len(heic_files)} converted")
        total_converted += converted_here

    print(f"\n✅ Done. {total_converted} converted, {total_failed} failed.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="raw_photos", help="Root folder containing category subfolders")
    args = parser.parse_args()

    root = Path(args.dir)
    if not root.exists():
        print(f"Folder not found: {root}")
        raise SystemExit(1)

    convert(root)
