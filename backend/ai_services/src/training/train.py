"""
TAZA AI Service - Training pipeline.

Two-phase transfer learning:
  Phase 1 (warmup): backbone frozen, only the new classification head trains.
                     Fast, stabilizes the new head before touching pretrained weights.
  Phase 2 (fine-tune): backbone unfrozen, whole network trains at a lower LR.

Class imbalance handled via inverse-frequency class weights in the loss
(configurable). Early stopping on val macro-F1 (not accuracy) because
accuracy is misleading under class imbalance and because false negatives
(rotten predicted fresh) matter more than raw accuracy for this product.

Usage:
    python -m src.training.train --config configs/train_config.yaml
"""
import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import yaml
from sklearn.metrics import f1_score
from sklearn.utils.class_weight import compute_class_weight
from torch.utils.data import DataLoader
from tqdm import tqdm

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.data.dataset import build_splits, build_class_mapping, save_splits_manifest, FreshnessImageDataset
from src.data.transforms import get_train_transform, get_eval_transform
from src.models.classifier import build_model, freeze_backbone, unfreeze_backbone, count_trainable_params


def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def compute_loss_weights(splits, class_to_idx, device):
    train_labels = [class_to_idx[label] for _, label in splits["train"]]
    classes = np.arange(len(class_to_idx))
    weights = compute_class_weight(class_weight="balanced", classes=classes, y=train_labels)
    return torch.tensor(weights, dtype=torch.float32, device=device)


def run_epoch(model, loader, criterion, optimizer, device, train: bool):
    model.train() if train else model.eval()
    total_loss = 0.0
    all_preds, all_labels = [], []

    context = torch.enable_grad() if train else torch.no_grad()
    with context:
        for images, labels in tqdm(loader, leave=False, desc="train" if train else "eval"):
            images, labels = images.to(device), labels.to(device)

            if train:
                optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            if train:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            preds = outputs.argmax(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(loader.dataset)
    f1_macro = f1_score(all_labels, all_preds, average="macro", zero_division=0)
    acc = np.mean(np.array(all_preds) == np.array(all_labels))
    return avg_loss, acc, f1_macro


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/train_config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    device = get_device()
    print(f"Using device: {device}")

    torch.manual_seed(cfg["data"]["seed"])
    np.random.seed(cfg["data"]["seed"])

    # ---- Data ----
    print("Building stratified splits (leakage-checked)...")
    splits = build_splits(
        raw_root=cfg["data"]["raw_root"],
        val_split=cfg["data"]["val_split"],
        test_split=cfg["data"]["test_split"],
        seed=cfg["data"]["seed"],
    )
    class_to_idx = build_class_mapping(splits)
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    print(f"Classes ({len(class_to_idx)}): {class_to_idx}")
    for split_name, records in splits.items():
        print(f"  {split_name}: {len(records)} images")

    out_dir = Path(cfg["output"]["saved_models_dir"])
    out_dir.mkdir(parents=True, exist_ok=True)
    save_splits_manifest(splits, class_to_idx, str(out_dir / "splits_manifest.json"))

    with open(out_dir / cfg["output"]["class_mapping_name"], "w") as f:
        json.dump({"class_to_idx": class_to_idx, "idx_to_class": idx_to_class}, f, indent=2)

    train_ds = FreshnessImageDataset(splits["train"], class_to_idx, get_train_transform(cfg))
    val_ds = FreshnessImageDataset(splits["val"], class_to_idx, get_eval_transform(cfg))

    train_loader = DataLoader(
        train_ds, batch_size=cfg["data"]["batch_size"], shuffle=True,
        num_workers=cfg["data"]["num_workers"], pin_memory=(device.type == "cuda"),
    )
    val_loader = DataLoader(
        val_ds, batch_size=cfg["data"]["batch_size"], shuffle=False,
        num_workers=cfg["data"]["num_workers"], pin_memory=(device.type == "cuda"),
    )

    # ---- Model ----
    model = build_model(
        cfg["model"]["architecture"], num_classes=len(class_to_idx),
        pretrained=cfg["model"]["pretrained"], dropout=cfg["model"]["dropout"],
    ).to(device)

    class_weights = compute_loss_weights(splits, class_to_idx, device) if cfg["training"]["use_class_weights"] else None
    print(f"Class weights: {class_weights}")
    criterion = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=cfg["training"]["label_smoothing"])

    best_metric = -1.0
    best_state = None
    epochs_without_improvement = 0
    history = []

    freeze_epochs = cfg["model"]["freeze_backbone_epochs"]
    total_epochs = cfg["training"]["epochs"]

    for epoch in range(total_epochs):
        phase = "warmup" if epoch < freeze_epochs else "finetune"

        if epoch == 0:
            freeze_backbone(model)
            optimizer = torch.optim.Adam(
                filter(lambda p: p.requires_grad, model.parameters()),
                lr=cfg["training"]["lr_head"], weight_decay=cfg["training"]["weight_decay"],
            )
            scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode="max", factor=cfg["training"]["lr_factor"], patience=cfg["training"]["lr_patience"]
            )
            print(f"Trainable params (warmup, head only): {count_trainable_params(model):,}")

        if epoch == freeze_epochs:
            unfreeze_backbone(model)
            optimizer = torch.optim.Adam(
                model.parameters(), lr=cfg["training"]["lr_finetune"], weight_decay=cfg["training"]["weight_decay"],
            )
            scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
                optimizer, mode="max", factor=cfg["training"]["lr_factor"], patience=cfg["training"]["lr_patience"]
            )
            print(f"Trainable params (finetune, full network): {count_trainable_params(model):,}")

        t0 = time.time()
        train_loss, train_acc, train_f1 = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        val_loss, val_acc, val_f1 = run_epoch(model, val_loader, criterion, optimizer, device, train=False)
        scheduler.step(val_f1)
        dt = time.time() - t0

        current_lr = optimizer.param_groups[0]["lr"]
        print(
            f"Epoch {epoch+1:2d}/{total_epochs} [{phase:8s}] "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} train_f1={train_f1:.4f} | "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} val_f1={val_f1:.4f} | "
            f"lr={current_lr:.2e} ({dt:.1f}s)"
        )
        history.append({
            "epoch": epoch + 1, "phase": phase,
            "train_loss": train_loss, "train_acc": train_acc, "train_f1": train_f1,
            "val_loss": val_loss, "val_acc": val_acc, "val_f1": val_f1, "lr": current_lr,
        })

        if val_f1 > best_metric:
            best_metric = val_f1
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}
            epochs_without_improvement = 0
            print(f"  -> New best val_f1_macro: {best_metric:.4f}. Checkpointing.")
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= cfg["training"]["early_stopping_patience"]:
                print(f"Early stopping triggered at epoch {epoch+1} (no improvement for "
                      f"{cfg['training']['early_stopping_patience']} epochs).")
                break

    # Save best model + full config needed to reconstruct it at inference time
    model.load_state_dict(best_state)
    checkpoint = {
        "model_state_dict": best_state,
        "architecture": cfg["model"]["architecture"],
        "num_classes": len(class_to_idx),
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "dropout": cfg["model"]["dropout"],
        "image_size": cfg["data"]["image_size"],
        "best_val_f1_macro": best_metric,
    }
    model_path = out_dir / cfg["output"]["best_model_name"]
    torch.save(checkpoint, model_path)
    print(f"\nBest model saved to {model_path} (val_f1_macro={best_metric:.4f})")

    with open(out_dir / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    print("\nTraining complete. Next step: python -m src.training.evaluate --config", args.config)


if __name__ == "__main__":
    main()
