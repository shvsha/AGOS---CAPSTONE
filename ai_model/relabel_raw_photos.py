"""
AGOS - relabel_raw_photos.py
==============================
Walks through every photo ALREADY sitting in raw_photos/<category>/ and lets
you confirm or correct its label. Use this for a verification pass after
your first labeling round, especially after review_misclassified.py showed
real confusion patterns.

For each photo, its current label is shown. You decide:
  1  -> biodegradable   (moves the file here if it wasn't already)
  2  -> recyclable
  3  -> residual
  4  -> special_waste
  5  -> none
  M  -> mixed waste      -> raw_photos_mixed/unsorted/
  D  -> bad/unusable photo (blurry, wrong subject, corrupted-looking, etc.)
                            -> raw_photos_removed/ (quarantined, NOT deleted,
                               so nothing is lost if you change your mind)
  S  -> skip             (reappears next run)
  Q  -> quit & save

If you press the SAME number as the current label, that just confirms it
(no file move) and marks it reviewed. If you press a different number, the
file is physically moved into the new category folder.

Already-reviewed photos are remembered (by filename) so re-running the
script only shows you what's left - you can do this in short sessions.

Usage:
  python relabel_raw_photos.py
  python relabel_raw_photos.py --root raw_photos
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
CATEGORY_LIST = list(CATEGORIES.values())
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
DISPLAY_MAX = 560


def get_images_with_labels(root: Path):
    """Return list of (path, current_category) for every image in the 5 category folders."""
    items = []
    for cat in CATEGORY_LIST:
        cat_dir = root / cat
        if not cat_dir.exists():
            continue
        for p in sorted(cat_dir.iterdir()):
            if p.suffix.lower() in IMAGE_EXTS:
                items.append((p, cat))
    return items


def load_progress(path: Path) -> dict:
    if path.exists():
        return json.loads(path.read_text())
    return {"reviewed": [], "moved_tally": {}}


def save_progress(path: Path, progress: dict):
    path.write_text(json.dumps(progress, indent=2))


def unique_dest(dest_dir: Path, filename: str) -> Path:
    dest = dest_dir / filename
    if not dest.exists():
        return dest
    stem, suffix = Path(filename).stem, Path(filename).suffix
    i = 1
    while (dest_dir / f"{stem}_dup{i}{suffix}").exists():
        i += 1
    return dest_dir / f"{stem}_dup{i}{suffix}"


class RelabelApp:
    def __init__(self, root: Path, progress_path: Path):
        self.root = root
        self.mixed_dir = root.parent / "raw_photos_mixed" / "unsorted"
        self.removed_dir = root.parent / "raw_photos_removed"
        self.progress_path = progress_path
        self.progress = load_progress(progress_path)
        self.reviewed = set(self.progress.get("reviewed", []))
        self.progress.setdefault("moved_tally", {})

        print("Scanning raw_photos/ ...")
        all_items = get_images_with_labels(root)
        self.total_all = len(all_items)
        self.queue = [(p, c) for (p, c) in all_items if p.name not in self.reviewed]
        print(f"{self.total_all} total photos, {len(self.queue)} left to review.")

        self.idx = 0

        self.root_win = tk.Tk()
        self.root_win.title("AGOS - Relabel / verify raw photos")
        self.root_win.resizable(True, True)

        # Everything in this block is critical for making a decision, so it
        # is packed FIRST (top of window) - it will always be visible even
        # if the photo is tall/portrait and the window can't fit everything.
        self.label_info = tk.Label(self.root_win, font=("Segoe UI", 12, "bold"), justify="left")
        self.label_info.pack(pady=(6, 2))

        self.label_current = tk.Label(self.root_win, font=("Segoe UI", 14, "bold"), fg="#0a5")
        self.label_current.pack(pady=2)

        self.help_label = tk.Label(
            self.root_win,
            text=(
                "1=biodegradable  2=recyclable  3=residual  4=special_waste  5=none   "
                "M=mixed   D=bad photo   S=skip   Q=quit & save\n"
                "(pressing the SAME number as current label just confirms it)"
            ),
            font=("Segoe UI", 10),
            fg="gray",
            justify="center",
        )
        self.help_label.pack(pady=(2, 6))

        # Image goes below the critical info - if the window runs out of
        # vertical space, it's the image that gets cropped, not the controls.
        self.image_label = tk.Label(self.root_win)
        self.image_label.pack()

        self.label_tally = tk.Label(self.root_win, font=("Segoe UI", 9), fg="#444")
        self.label_tally.pack(pady=4)

        # Leave ~220px of headroom for the text controls + title bar + taskbar
        screen_h = self.root_win.winfo_screenheight()
        self.display_max = min(DISPLAY_MAX, max(320, screen_h - 220))

        for key in CATEGORIES:
            self.root_win.bind(key, self.make_decide(key))
        self.root_win.bind("m", lambda e: self.decide_special("mixed"))
        self.root_win.bind("M", lambda e: self.decide_special("mixed"))
        self.root_win.bind("d", lambda e: self.decide_special("removed"))
        self.root_win.bind("D", lambda e: self.decide_special("removed"))
        self.root_win.bind("s", lambda e: self.skip())
        self.root_win.bind("S", lambda e: self.skip())
        self.root_win.bind("q", lambda e: self.quit())
        self.root_win.bind("Q", lambda e: self.quit())

        self.show_current()
        self.root_win.mainloop()

    def make_decide(self, key):
        return lambda e: self.decide(CATEGORIES[key])

    def update_tally_label(self):
        tally = self.progress["moved_tally"]
        if not tally:
            text = "No corrections made yet this session/history."
        else:
            text = "Corrections so far: " + "   ".join(f"{k}: {v}" for k, v in tally.items())
        self.label_tally.config(text=text)

    def show_current(self):
        self.update_tally_label()
        if self.idx >= len(self.queue):
            done = len(self.reviewed)
            self.label_info.config(text=f"All done! {done}/{self.total_all} reviewed. Close this window.")
            self.label_current.config(text="")
            self.image_label.config(image="")
            return

        img_path, current_cat = self.queue[self.idx]
        done_count = len(self.reviewed)
        self.label_info.config(text=f"[{done_count + 1}/{self.total_all}]   {img_path.name}")
        self.label_current.config(text=f"Currently labeled: {current_cat}")

        try:
            img = Image.open(img_path)
            img = ImageOps.exif_transpose(img)
            img = img.convert("RGB")
            img.thumbnail((self.display_max, self.display_max))
            self.tk_img = ImageTk.PhotoImage(img)
            self.image_label.config(image=self.tk_img)
        except Exception as e:
            self.label_info.config(text=f"[UNREADABLE] {img_path.name}: {e}")
            self.image_label.config(image="")

    def _finalize(self, img_path: Path, moved_to: str = None):
        self.reviewed.add(img_path.name)
        self.progress["reviewed"] = list(self.reviewed)
        if moved_to:
            self.progress["moved_tally"][moved_to] = self.progress["moved_tally"].get(moved_to, 0) + 1
        save_progress(self.progress_path, self.progress)
        self.idx += 1
        self.show_current()

    def decide(self, new_cat):
        if self.idx >= len(self.queue):
            return
        img_path, current_cat = self.queue[self.idx]

        if new_cat == current_cat:
            # confirmed, no move needed
            self._finalize(img_path)
            return

        dest_dir = self.root / new_cat
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = unique_dest(dest_dir, img_path.name)
        try:
            shutil.move(str(img_path), str(dest_path))
            self._finalize(img_path, moved_to=f"->{new_cat}")
        except Exception as e:
            print(f"  [WARN] Could not move {img_path.name}: {e}")
            self._finalize(img_path)

    def decide_special(self, kind):
        if self.idx >= len(self.queue):
            return
        img_path, current_cat = self.queue[self.idx]
        dest_dir = self.mixed_dir if kind == "mixed" else self.removed_dir
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = unique_dest(dest_dir, img_path.name)
        try:
            shutil.move(str(img_path), str(dest_path))
            self._finalize(img_path, moved_to=f"->{kind}")
        except Exception as e:
            print(f"  [WARN] Could not move {img_path.name}: {e}")
            self._finalize(img_path)

    def skip(self):
        self.idx += 1
        self.show_current()

    def quit(self):
        self.root_win.destroy()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default="raw_photos", help="Folder containing the 5 category subfolders")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        print(f"Folder not found: {root}")
        raise SystemExit(1)

    progress_path = root / ".relabel_progress.json"
    RelabelApp(root, progress_path)