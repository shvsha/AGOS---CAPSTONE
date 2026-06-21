"""
AGOS - sort_raw_photos.py
==========================
Interactive tool to manually triage raw photos into "pure" (one clearly
dominant waste type) vs "mixed" (multiple waste types visible in the same
photo) before training. Mixed-content photos with a single label teach a
single-label classifier contradictory things — sorting them out first gives
the model a much cleaner signal to learn from.

Pure photos get copied into:   raw_photos_pure/<category>/
Mixed photos get copied into:  raw_photos_mixed/<category>/
(originals in raw_photos/ are left untouched — these are copies)

Controls (while viewing each photo):
  P  -> Pure   (single dominant waste type)
  M  -> Mixed  (multiple waste types visible)
  S  -> Skip   (decide later — will show up again next run)
  Q  -> Quit   (progress is saved automatically, resume anytime)

Progress is saved to raw_photos/.sort_progress.json, so you can close this
anytime and pick up where you left off.

Usage:
  python sort_raw_photos.py
  python sort_raw_photos.py --src raw_photos
"""

import json
import shutil
import argparse
from pathlib import Path
import tkinter as tk
from PIL import Image, ImageTk

CATEGORIES = ["biodegradable", "none", "recyclable", "residual", "special_waste"]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
PROGRESS_FILENAME = ".sort_progress.json"
DISPLAY_MAX = 700  # max width/height for the preview window


def get_images(folder: Path):
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTS)


def load_progress(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {}


def save_progress(path: Path, progress: dict):
    path.write_text(json.dumps(progress, indent=2))


class SortApp:
    def __init__(self, src_root: Path, progress_path: Path):
        self.src_root = src_root
        self.progress_path = progress_path
        self.progress = load_progress(progress_path)

        self.total_all = 0
        self.queue = []  # (category, image_path, key) for anything not yet decided
        for cat in CATEGORIES:
            cat_dir = src_root / cat
            if not cat_dir.exists():
                continue
            imgs = get_images(cat_dir)
            self.total_all += len(imgs)
            for img_path in imgs:
                key = f"{cat}/{img_path.name}"
                if key not in self.progress:
                    self.queue.append((cat, img_path, key))

        self.idx = 0

        self.root = tk.Tk()
        self.root.title("AGOS - Sort raw photos: Pure vs Mixed waste")

        self.label_info = tk.Label(self.root, font=("Segoe UI", 11))
        self.label_info.pack(pady=4)

        self.image_label = tk.Label(self.root)
        self.image_label.pack()

        self.help_label = tk.Label(
            self.root,
            text="P = Pure (one waste type)    M = Mixed (multiple types)    S = Skip    Q = Quit & save",
            font=("Segoe UI", 10),
            fg="gray",
        )
        self.help_label.pack(pady=6)

        self.root.bind("p", lambda e: self.decide("pure"))
        self.root.bind("P", lambda e: self.decide("pure"))
        self.root.bind("m", lambda e: self.decide("mixed"))
        self.root.bind("M", lambda e: self.decide("mixed"))
        self.root.bind("s", lambda e: self.decide("skip"))
        self.root.bind("S", lambda e: self.decide("skip"))
        self.root.bind("q", lambda e: self.quit())
        self.root.bind("Q", lambda e: self.quit())

        self.show_current()
        self.root.mainloop()

    def show_current(self):
        if self.idx >= len(self.queue):
            already_done = self.total_all - len(self.queue)
            self.label_info.config(
                text=f"All done! {already_done}/{self.total_all} photos have a decision. "
                     f"Close this window."
            )
            self.image_label.config(image="")
            return

        cat, img_path, key = self.queue[self.idx]
        done_count = (self.total_all - len(self.queue)) + self.idx
        self.label_info.config(
            text=f"[{done_count + 1}/{self.total_all}]  category: {cat}   |   {img_path.name}"
        )

        try:
            img = Image.open(img_path).convert("RGB")
            img.thumbnail((DISPLAY_MAX, DISPLAY_MAX))
            self.tk_img = ImageTk.PhotoImage(img)
            self.image_label.config(image=self.tk_img)
        except Exception as e:
            self.label_info.config(text=f"[UNREADABLE] {img_path.name}: {e}")
            self.image_label.config(image="")

    def decide(self, label):
        if self.idx >= len(self.queue):
            return
        cat, img_path, key = self.queue[self.idx]

        if label in ("pure", "mixed"):
            dest_dir = self.src_root.parent / f"raw_photos_{label}" / cat
            dest_dir.mkdir(parents=True, exist_ok=True)
            try:
                shutil.copy2(img_path, dest_dir / img_path.name)
            except Exception as e:
                print(f"  [WARN] Could not copy {img_path.name}: {e}")
            self.progress[key] = label
            save_progress(self.progress_path, self.progress)

        # "skip" just advances for this session without saving a decision,
        # so it reappears next time the script is run.
        self.idx += 1
        self.show_current()

    def quit(self):
        self.root.destroy()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="raw_photos",
                        help="Folder of raw photos to triage (per-category subfolders)")
    args = parser.parse_args()

    src_root = Path(args.src)
    if not src_root.exists():
        print(f"Folder not found: {src_root}")
        raise SystemExit(1)

    progress_path = src_root / PROGRESS_FILENAME
    SortApp(src_root, progress_path)
