"""
AGOS - label_raw_photos.py
===========================
Interactive tool to manually label a flat pile of unsorted photos (e.g. the
TACO dataset's data/batch_1 ... batch_15 folders) directly into your 5 AGOS
categories - in ONE pass. This replaces the need to first sort into
per-category folders by hand.

For each photo you decide:
  1  -> biodegradable
  2  -> recyclable
  3  -> residual
  4  -> special_waste
  5  -> none        (no clear waste / clean background)
  M  -> mixed        (multiple different waste types in one photo - goes to
                       raw_photos_mixed/unsorted/ instead of a category,
                       since a single-label classifier shouldn't be trained
                       on it directly)
  S  -> skip         (decide later - reappears next run)
  Q  -> quit & save

Photos land in:
  raw_photos/<category>/<source_batch>__<filename>      (for 1-5)
  raw_photos_mixed/unsorted/<source_batch>__<filename>  (for M)

Originals are never modified or deleted - these are copies. Progress
(including a running per-category tally) is saved after every decision to
a JSON file, so you can label in short bursts and resume anytime.

Usage:
  python label_raw_photos.py --src "C:\\Users\\admin\\Downloads\\archive-001\\data"
  python label_raw_photos.py --src "C:\\Users\\admin\\Downloads\\archive-001\\data" --dest-root raw_photos
"""

import json
import shutil
import argparse
from pathlib import Path
import tkinter as tk
from PIL import Image, ImageTk, ImageOps

CATEGORIES = {
    "1": "biodegradable",
    "2": "recyclable",
    "3": "residual",
    "4": "special_waste",
    "5": "none",
}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DISPLAY_MAX = 760  # max width/height for the preview window


def get_images_recursive(folder: Path):
    """Find every image file under folder, any depth (handles batch_1..batch_15)."""
    imgs = [p for p in folder.rglob("*") if p.suffix.lower() in IMAGE_EXTS]
    return sorted(imgs, key=lambda p: str(p))


def unique_name(img_path: Path, src_root: Path) -> str:
    """Prefix filename with its parent folder(s) relative to src_root so that
    e.g. batch_1/000000.jpg and batch_8/000000.jpg don't collide on copy."""
    rel = img_path.relative_to(src_root)
    prefix = "__".join(rel.parts[:-1]) if len(rel.parts) > 1 else src_root.name
    return f"{prefix}__{img_path.name}"


def load_progress(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {"decisions": {}, "tally": {}}


def save_progress(path: Path, progress: dict):
    path.write_text(json.dumps(progress, indent=2))


class LabelApp:
    def __init__(self, src_root: Path, dest_root: Path, progress_path: Path):
        self.src_root = src_root
        self.dest_root = dest_root
        self.mixed_dir = dest_root.parent / "raw_photos_mixed" / "unsorted"
        self.progress_path = progress_path
        self.progress = load_progress(progress_path)
        self.progress.setdefault("decisions", {})
        self.progress.setdefault("tally", {c: 0 for c in list(CATEGORIES.values()) + ["mixed"]})

        print("Scanning for images (this can take a moment for large datasets)...")
        all_imgs = get_images_recursive(src_root)
        self.total_all = len(all_imgs)
        print(f"Found {self.total_all} images under {src_root}")

        self.queue = [p for p in all_imgs if str(p.relative_to(src_root)) not in self.progress["decisions"]]

        self.idx = 0

        self.root = tk.Tk()
        self.root.title("AGOS - Label raw photos into categories")

        self.label_info = tk.Label(self.root, font=("Segoe UI", 11), justify="left")
        self.label_info.pack(pady=4)

        self.image_label = tk.Label(self.root)
        self.image_label.pack()

        self.label_tally = tk.Label(self.root, font=("Segoe UI", 9), fg="#444")
        self.label_tally.pack(pady=2)

        self.help_label = tk.Label(
            self.root,
            text=(
                "1=biodegradable  2=recyclable  3=residual  4=special_waste  "
                "5=none      M=mixed   S=skip   Q=quit & save"
            ),
            font=("Segoe UI", 10),
            fg="gray",
        )
        self.help_label.pack(pady=6)

        for key in CATEGORIES:
            self.root.bind(key, self.make_decide_category(key))
        self.root.bind("m", lambda e: self.decide("mixed"))
        self.root.bind("M", lambda e: self.decide("mixed"))
        self.root.bind("s", lambda e: self.decide("skip"))
        self.root.bind("S", lambda e: self.decide("skip"))
        self.root.bind("q", lambda e: self.quit())
        self.root.bind("Q", lambda e: self.quit())

        self.show_current()
        self.root.mainloop()

    def make_decide_category(self, key):
        return lambda e: self.decide(CATEGORIES[key])

    def update_tally_label(self):
        tally = self.progress["tally"]
        text = "So far: " + "   ".join(f"{k}: {v}" for k, v in tally.items())
        self.label_tally.config(text=text)

    def show_current(self):
        self.update_tally_label()
        if self.idx >= len(self.queue):
            done = len(self.progress["decisions"])
            self.label_info.config(
                text=f"All done! {done}/{self.total_all} photos have a decision. Close this window."
            )
            self.image_label.config(image="")
            return

        img_path = self.queue[self.idx]
        done_count = len(self.progress["decisions"])
        rel = img_path.relative_to(self.src_root)
        self.label_info.config(
            text=f"[{done_count + 1}/{self.total_all}]   {rel}"
        )

        try:
            img = Image.open(img_path)
            img = ImageOps.exif_transpose(img)  # fix sideways mobile photos
            img = img.convert("RGB")
            img.thumbnail((DISPLAY_MAX, DISPLAY_MAX))
            self.tk_img = ImageTk.PhotoImage(img)
            self.image_label.config(image=self.tk_img)
        except Exception as e:
            self.label_info.config(text=f"[UNREADABLE] {img_path.name}: {e}")
            self.image_label.config(image="")

    def decide(self, label):
        if self.idx >= len(self.queue):
            return
        img_path = self.queue[self.idx]
        rel_key = str(img_path.relative_to(self.src_root))

        if label == "skip":
            self.idx += 1
            self.show_current()
            return

        if label == "mixed":
            dest_dir = self.mixed_dir
        else:
            dest_dir = self.dest_root / label
        dest_dir.mkdir(parents=True, exist_ok=True)

        new_name = unique_name(img_path, self.src_root)
        try:
            shutil.copy2(img_path, dest_dir / new_name)
            self.progress["decisions"][rel_key] = label
            self.progress["tally"][label] = self.progress["tally"].get(label, 0) + 1
            save_progress(self.progress_path, self.progress)
        except Exception as e:
            print(f"  [WARN] Could not copy {img_path.name}: {e}")

        self.idx += 1
        self.show_current()

    def quit(self):
        self.root.destroy()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", required=True,
                         help="Folder of raw unsorted photos to label (searched recursively, "
                              "e.g. the TACO 'data' folder containing batch_1..batch_15)")
    parser.add_argument("--dest-root", default="raw_photos",
                         help="Where labeled category folders get created (default: raw_photos)")
    args = parser.parse_args()

    src_root = Path(args.src)
    if not src_root.exists():
        print(f"Folder not found: {src_root}")
        raise SystemExit(1)

    dest_root = Path(args.dest_root)
    dest_root.mkdir(parents=True, exist_ok=True)

    progress_path = dest_root / ".label_progress_taco.json"
    LabelApp(src_root, dest_root, progress_path)
