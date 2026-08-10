"""
TAZA AI Service - Dataset construction.

Builds a class-indexed image list from data/raw, then produces a
stratified train/val/test split at the FILE level (not just directory
level) so no image ever appears in more than one split. This is the
primary leakage-prevention mechanism, alongside a duplicate-hash check.

If the raw dataset already ships with train/test folders, we respect
that split and only carve val out of the shipped train set — we never
merge the shipped test set back in, since that's the leak most people
accidentally introduce when "cleaning up" a Kaggle dataset.
"""
import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

from sklearn.model_selection import train_test_split
from torch.utils.data import Dataset
from PIL import Image

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
SPLIT_MARKERS = {"train", "test", "val", "validation"}


def infer_label_from_path(path: Path, root: Path) -> str:
    rel_parts = path.relative_to(root).parts
    parts = [p for p in rel_parts if p.lower() not in SPLIT_MARKERS and p.lower() != "dataset"]
    return "_".join(parts) if parts else path.name


def scan_dataset(root: Path) -> Tuple[List[Tuple[Path, str, str]], Dict[str, int]]:
    """
    Returns:
        records: list of (filepath, label, shipped_split_or_none)
        label_counts: dict of label -> count
    """
    records = []
    label_counts = defaultdict(int)

    for dirpath, dirnames, filenames in os.walk(root):
        img_files = [f for f in filenames if Path(f).suffix.lower() in IMG_EXTS]
        if not img_files or any(Path(dirpath, d).is_dir() for d in dirnames):
            continue
        dirpath = Path(dirpath)
        label = infer_label_from_path(dirpath, root)

        shipped_split = None
        for part in dirpath.relative_to(root).parts:
            if part.lower() in {"train", "test", "val", "validation"}:
                shipped_split = "val" if part.lower() == "validation" else part.lower()

        for f in img_files:
            records.append((dirpath / f, label, shipped_split))
            label_counts[label] += 1

    return records, dict(label_counts)


def file_hash(path: Path, block_size: int = 65536) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(block_size), b""):
            h.update(chunk)
    return h.hexdigest()


def detect_duplicates_across_split(records_by_split: Dict[str, List[Path]]) -> List[str]:
    """
    Hash-based duplicate check across splits. Returns list of warnings.
    Only run on reasonably sized datasets (this is O(n) hashing, fine for ~15k images,
    would need sampling for much larger datasets).
    """
    warnings = []
    hash_to_split = {}
    for split, paths in records_by_split.items():
        for p in paths:
            h = file_hash(p)
            if h in hash_to_split and hash_to_split[h] != split:
                warnings.append(f"Duplicate image across splits: {p} matches content already in {hash_to_split[h]}")
            hash_to_split.setdefault(h, split)
    return warnings


def build_splits(
    raw_root: str,
    val_split: float = 0.15,
    test_split: float = 0.15,
    seed: int = 42,
    check_duplicates: bool = True,
) -> Dict[str, List[Tuple[str, str]]]:
    """
    Returns dict: {'train': [(path, label), ...], 'val': [...], 'test': [...]}
    """
    root = Path(raw_root)
    records, label_counts = scan_dataset(root)
    if not records:
        raise ValueError(f"No images found under {root}")

    shipped_splits = set(s for _, _, s in records if s is not None)

    if "test" in shipped_splits:
        # Respect shipped test set. Never touch it. Carve val from shipped train.
        train_pool = [(p, l) for p, l, s in records if s == "train"]
        test_set = [(p, l) for p, l, s in records if s == "test"]
        # unlabeled-split leftovers (rare) go into the train pool
        train_pool += [(p, l) for p, l, s in records if s not in ("train", "test")]

        paths = [p for p, l in train_pool]
        labels = [l for p, l in train_pool]
        val_fraction_of_pool = val_split / (1 - test_split) if test_split < 1 else val_split
        train_paths, val_paths, train_labels, val_labels = train_test_split(
            paths, labels, test_size=val_fraction_of_pool, stratify=labels, random_state=seed
        )
        splits = {
            "train": list(zip(train_paths, train_labels)),
            "val": list(zip(val_paths, val_labels)),
            "test": test_set,
        }
    else:
        paths = [p for p, l, s in records]
        labels = [l for p, l, s in records]
        train_paths, temp_paths, train_labels, temp_labels = train_test_split(
            paths, labels, test_size=(val_split + test_split), stratify=labels, random_state=seed
        )
        relative_test = test_split / (val_split + test_split)
        val_paths, test_paths, val_labels, test_labels = train_test_split(
            temp_paths, temp_labels, test_size=relative_test, stratify=temp_labels, random_state=seed
        )
        splits = {
            "train": list(zip(train_paths, train_labels)),
            "val": list(zip(val_paths, val_labels)),
            "test": list(zip(test_paths, test_labels)),
        }

    if check_duplicates:
        by_split = {k: [Path(p) for p, l in v] for k, v in splits.items()}
        warnings = detect_duplicates_across_split(by_split)
        if warnings:
            print(f"WARNING: {len(warnings)} duplicate images found across splits (leakage risk).")
            for w in warnings[:10]:
                print(f"  {w}")
            if len(warnings) > 10:
                print(f"  ... and {len(warnings) - 10} more")

    # stringify paths for JSON-friendliness downstream
    return {k: [(str(p), l) for p, l in v] for k, v in splits.items()}


class FreshnessImageDataset(Dataset):
    """Simple image dataset over (path, label) pairs with a class_to_idx mapping."""

    def __init__(self, records: List[Tuple[str, str]], class_to_idx: Dict[str, int], transform=None):
        self.records = records
        self.class_to_idx = class_to_idx
        self.transform = transform

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        path, label = self.records[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, self.class_to_idx[label]


def build_class_mapping(splits: Dict[str, List[Tuple[str, str]]]) -> Dict[str, int]:
    all_labels = sorted(set(label for split in splits.values() for _, label in split))
    return {label: idx for idx, label in enumerate(all_labels)}


def save_splits_manifest(splits: Dict[str, List[Tuple[str, str]]], class_to_idx: Dict[str, int], out_path: str):
    manifest = {
        "class_to_idx": class_to_idx,
        "counts": {k: len(v) for k, v in splits.items()},
        "splits": splits,
    }
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(manifest, f, indent=2)
