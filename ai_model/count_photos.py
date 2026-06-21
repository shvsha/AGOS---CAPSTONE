"""
AGOS - count_photos.py
========================
Quick count of how many photos ended up in each category, across
raw_photos_pure/ and raw_photos_mixed/ (or any folders you point it at).

Usage:
  python count_photos.py
  python count_photos.py --roots raw_photos_pure raw_photos_mixed
"""

import argparse
from pathlib import Path

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]


def count(root: str):
    print(f"\n{root}:")
    root_path = Path(root)
    if not root_path.exists():
        print("  (folder not found)")
        return
    for cat in CATEGORIES:
        d = root_path / cat
        n = len(list(d.glob("*"))) if d.exists() else 0
        print(f"  {cat:15s}: {n}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--roots",
        nargs="+",
        default=["raw_photos_pure", "raw_photos_mixed"],
        help="Folders to count (default: raw_photos_pure raw_photos_mixed)",
    )
    args = parser.parse_args()

    for root in args.roots:
        count(root)
    print()
