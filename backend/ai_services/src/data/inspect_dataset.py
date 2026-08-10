"""
FreshFlow OS - Dataset inspection.

Run this FIRST, before writing any training code, on whatever dataset
you actually downloaded. Hackathon Kaggle datasets vary in folder layout
(train/test presplit vs single pool, class naming, corrupt files), and
guessing wrong here causes silent data leakage or broken labels later.

Usage:
    python src/data/inspect_dataset.py --root data/raw
"""
import argparse
import os
from collections import defaultdict
from pathlib import Path

from PIL import Image, UnidentifiedImageError

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def find_class_dirs(root: Path):
    """
    Walk the tree and find leaf directories that contain images directly.
    These are treated as class folders regardless of nesting depth
    (handles both flat `class/` and nested `fruit/fresh|rotten/` layouts).
    """
    leaf_dirs = []
    for dirpath, dirnames, filenames in os.walk(root):
        img_files = [f for f in filenames if Path(f).suffix.lower() in IMG_EXTS]
        if img_files and not any(
            Path(dirpath, d).is_dir() for d in dirnames
        ):
            leaf_dirs.append((Path(dirpath), img_files))
    return leaf_dirs


def infer_label_from_path(path: Path, root: Path) -> str:
    """
    Derive a class label from a leaf directory's path relative to root.
    e.g. data/raw/train/freshapples -> 'freshapples'
         data/raw/apple/fresh       -> 'apple_fresh'
    """
    rel_parts = path.relative_to(root).parts
    # drop a leading split folder like train/test/val if present
    parts = [p for p in rel_parts if p.lower() not in {"train", "test", "val", "validation", "dataset"}]
    return "_".join(parts) if parts else path.name


def check_image_integrity(filepath: Path) -> bool:
    try:
        with Image.open(filepath) as img:
            img.verify()
        return True
    except (UnidentifiedImageError, OSError):
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=str, default="data/raw")
    parser.add_argument("--sample-integrity-check", type=int, default=200,
                         help="Number of images per class to verify are not corrupt")
    args = parser.parse_args()

    root = Path(args.root)
    if not root.exists():
        raise SystemExit(f"Dataset root {root} does not exist. Download the dataset first.")

    leaf_dirs = find_class_dirs(root)
    if not leaf_dirs:
        raise SystemExit(f"No image-containing leaf directories found under {root}.")

    print(f"Found {len(leaf_dirs)} leaf directories with images under {root}\n")

    label_counts = defaultdict(int)
    label_paths = defaultdict(list)
    label_to_dirs = defaultdict(list)

    for dirpath, img_files in leaf_dirs:
        label = infer_label_from_path(dirpath, root)
        label_counts[label] += len(img_files)
        label_paths[label].extend([dirpath / f for f in img_files])
        label_to_dirs[label].append(str(dirpath))

    print("=" * 70)
    print("CLASS DISTRIBUTION")
    print("=" * 70)
    total = sum(label_counts.values())
    for label, count in sorted(label_counts.items(), key=lambda x: -x[1]):
        pct = 100 * count / total
        bar = "#" * int(pct / 2)
        print(f"  {label:25s} {count:6d} ({pct:5.1f}%)  {bar}")
    print(f"  {'TOTAL':25s} {total:6d}")

    # Imbalance check
    counts = list(label_counts.values())
    imbalance_ratio = max(counts) / min(counts)
    print(f"\nImbalance ratio (max/min class): {imbalance_ratio:.2f}x")
    if imbalance_ratio > 1.5:
        print("  -> Meaningful imbalance detected. Training pipeline will need")
        print("     class weighting or weighted sampling.")

    # Check whether dataset already has a train/test split baked in
    print("\n" + "=" * 70)
    print("PRE-EXISTING SPLIT CHECK")
    print("=" * 70)
    split_markers = {"train", "test", "val", "validation"}
    found_splits = set()
    for dirpath, _ in leaf_dirs:
        for part in dirpath.relative_to(root).parts:
            if part.lower() in split_markers:
                found_splits.add(part.lower())
    if found_splits:
        print(f"  Detected existing split folders: {sorted(found_splits)}")
        print("  IMPORTANT: reuse these splits as-is. Do NOT re-shuffle/merge")
        print("  images across them - that would leak test images into training.")
    else:
        print("  No pre-existing split detected. We will create our own")
        print("  stratified train/val/test split at the pipeline stage.")

    # Multi-fruit vs binary check (affects whether we do binary or multiclass head)
    print("\n" + "=" * 70)
    print("LABEL SEMANTICS")
    print("=" * 70)
    fresh_like = [l for l in label_counts if "fresh" in l.lower()]
    rotten_like = [l for l in label_counts if any(k in l.lower() for k in ["rotten", "stale", "spoiled"])]
    print(f"  Fresh-like labels:  {fresh_like}")
    print(f"  Rotten-like labels: {rotten_like}")
    n_fruit_types = len(set(
        l.lower().replace("fresh", "").replace("rotten", "").strip("_")
        for l in label_counts
    ))
    print(f"  Approx distinct produce types encoded in labels: {n_fruit_types}")

    # Integrity check on a sample
    print("\n" + "=" * 70)
    print(f"IMAGE INTEGRITY CHECK (sampling up to {args.sample_integrity_check}/class)")
    print("=" * 70)
    total_checked = 0
    total_corrupt = 0
    for label, paths in label_paths.items():
        sample = paths[: args.sample_integrity_check]
        corrupt = [p for p in sample if not check_image_integrity(p)]
        total_checked += len(sample)
        total_corrupt += len(corrupt)
        status = "OK" if not corrupt else f"{len(corrupt)} CORRUPT"
        print(f"  {label:25s} checked {len(sample):4d}  -> {status}")
        for c in corrupt[:3]:
            print(f"      corrupt: {c}")

    print(f"\n  Total checked: {total_checked}, corrupt found: {total_corrupt}")

    # Sample image size/mode
    print("\n" + "=" * 70)
    print("SAMPLE IMAGE PROPERTIES")
    print("=" * 70)
    for label, paths in list(label_paths.items())[:3]:
        with Image.open(paths[0]) as img:
            print(f"  {label}: size={img.size}, mode={img.mode}")

    print("\nInspection complete. Review imbalance / split / integrity notes above")
    print("before proceeding to src/data/dataset.py")


if __name__ == "__main__":
    main()
