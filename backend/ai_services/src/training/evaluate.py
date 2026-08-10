"""
FreshFlow OS - Rigorous test-set evaluation.

Evaluates the saved best model on the held-out TEST split only (never
seen during training or model selection). Reports:
  - overall accuracy, macro/weighted precision/recall/F1
  - per-class precision/recall/F1
  - confusion matrix (saved as PNG + raw counts)
  - explicit false-negative / false-positive breakdown for the
    fresh-vs-rotten distinction, since a rotten item predicted "fresh"
    (a false negative on spoilage) is the costly error for this product,
    while fresh predicted "rotten" (false positive) only costs discarded
    good produce - both matter, but asymmetrically.

Usage:
    python -m src.training.evaluate --config configs/train_config.yaml
"""
import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
import yaml
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_recall_fscore_support,
)
from torch.utils.data import DataLoader

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.data.dataset import FreshnessImageDataset
from src.data.transforms import get_eval_transform
from src.models.classifier import build_model


def load_config(path: str) -> dict:
    with open(path) as f:
        return yaml.safe_load(f)


def get_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def label_is_fresh(label: str) -> bool:
    l = label.lower()
    if "fresh" in l:
        return True
    if any(k in l for k in ["rotten", "stale", "spoiled"]):
        return False
    raise ValueError(f"Cannot infer fresh/rotten semantics from label '{label}'")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=str, default="configs/train_config.yaml")
    args = parser.parse_args()

    cfg = load_config(args.config)
    device = get_device()
    out_dir = Path(cfg["output"]["saved_models_dir"])

    # Load checkpoint (contains everything needed to reconstruct model + splits reference)
    model_path = out_dir / cfg["output"]["best_model_name"]
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)

    class_to_idx = checkpoint["class_to_idx"]
    idx_to_class = {int(k) if isinstance(k, str) else k: v for k, v in checkpoint["idx_to_class"].items()}

    model = build_model(
        checkpoint["architecture"], num_classes=checkpoint["num_classes"], pretrained=False,
        dropout=checkpoint["dropout"],
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.to(device)
    model.eval()

    # Load test split from the manifest saved during training (guarantees identical split)
    with open(out_dir / "splits_manifest.json") as f:
        manifest = json.load(f)
    test_records = [tuple(r) for r in manifest["splits"]["test"]]
    print(f"Evaluating on held-out TEST set: {len(test_records)} images (never used in training/model selection)")

    test_ds = FreshnessImageDataset(test_records, class_to_idx, get_eval_transform(cfg))
    test_loader = DataLoader(test_ds, batch_size=cfg["data"]["batch_size"], shuffle=False,
                              num_workers=cfg["data"]["num_workers"])

    all_preds, all_labels, all_confidences = [], [], []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            confs, preds = probs.max(dim=1)
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.numpy())
            all_confidences.extend(confs.cpu().numpy())

    all_preds = np.array(all_preds)
    all_labels = np.array(all_labels)
    class_names = [idx_to_class[i] for i in range(len(idx_to_class))]

    # ---- Standard metrics ----
    acc = accuracy_score(all_labels, all_preds)
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        all_labels, all_preds, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(
        all_labels, all_preds, average="weighted", zero_division=0
    )

    report = classification_report(all_labels, all_preds, target_names=class_names, zero_division=0, output_dict=True)

    print("\n" + "=" * 70)
    print("TEST SET RESULTS")
    print("=" * 70)
    print(f"Accuracy:            {acc:.4f}")
    print(f"Macro Precision:     {precision_macro:.4f}")
    print(f"Macro Recall:        {recall_macro:.4f}")
    print(f"Macro F1:            {f1_macro:.4f}")
    print(f"Weighted F1:         {f1_weighted:.4f}")
    print(f"Mean confidence:     {np.mean(all_confidences):.4f}")
    print("\nPer-class report:")
    print(classification_report(all_labels, all_preds, target_names=class_names, zero_division=0))

    # ---- Confusion matrix ----
    cm = confusion_matrix(all_labels, all_preds)
    plt.figure(figsize=(max(8, len(class_names)), max(6, len(class_names) * 0.8)))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=class_names, yticklabels=class_names)
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title("Confusion Matrix - Test Set")
    plt.tight_layout()
    cm_path = out_dir / cfg["output"]["confusion_matrix_name"]
    plt.savefig(cm_path, dpi=150)
    plt.close()
    print(f"\nConfusion matrix saved to {cm_path}")

    # ---- Fresh/Rotten collapsed FN/FP analysis (the business-critical error) ----
    try:
        fresh_class_idxs = {i for i, name in idx_to_class.items() if label_is_fresh(name)}
        true_is_fresh = np.array([idx in fresh_class_idxs for idx in all_labels])
        pred_is_fresh = np.array([idx in fresh_class_idxs for idx in all_preds])

        # False negative here = actually ROTTEN but predicted FRESH (dangerous: sold as good)
        false_negatives = int(np.sum((~true_is_fresh) & pred_is_fresh))
        # False positive here = actually FRESH but predicted ROTTEN (costly: wasted good produce)
        false_positives = int(np.sum(true_is_fresh & (~pred_is_fresh)))
        true_rotten = int(np.sum(~true_is_fresh))
        true_fresh = int(np.sum(true_is_fresh))

        fn_rate = false_negatives / true_rotten if true_rotten else float("nan")
        fp_rate = false_positives / true_fresh if true_fresh else float("nan")

        print("\n" + "=" * 70)
        print("FRESH vs ROTTEN CRITICAL ERROR ANALYSIS (collapsed across produce types)")
        print("=" * 70)
        print(f"True rotten items:  {true_rotten}")
        print(f"True fresh items:   {true_fresh}")
        print(f"False NEGATIVES (rotten predicted fresh - DANGEROUS): {false_negatives} "
              f"({fn_rate*100:.2f}% of rotten items misclassified as fresh)")
        print(f"False POSITIVES (fresh predicted rotten - wasteful):  {false_positives} "
              f"({fp_rate*100:.2f}% of fresh items misclassified as rotten)")
        if fn_rate > 0.05:
            print("\nWARNING: False negative rate exceeds 5%. This means >1 in 20 rotten items")
            print("would be classified as sellable. Given the product's goal (waste reduction")
            print("AND food safety), this is a meaningful weakness - consider: more rotten-class")
            print("training data, a confidence threshold that routes low-confidence 'fresh'")
            print("predictions to human review, or a cost-sensitive loss that penalizes this")
            print("error type more heavily.")
    except ValueError as e:
        false_negatives = false_positives = fn_rate = fp_rate = None
        print(f"\nCould not run fresh/rotten collapsed analysis: {e}")

    # ---- Persist full report ----
    full_report = {
        "test_set_size": len(test_records),
        "accuracy": acc,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro,
        "f1_macro": f1_macro,
        "precision_weighted": precision_weighted,
        "recall_weighted": recall_weighted,
        "f1_weighted": f1_weighted,
        "mean_confidence": float(np.mean(all_confidences)),
        "per_class_report": report,
        "confusion_matrix": cm.tolist(),
        "class_names": class_names,
        "critical_error_analysis": {
            "false_negatives_rotten_as_fresh": false_negatives,
            "false_negative_rate": None if fn_rate != fn_rate else fn_rate,  # NaN check
            "false_positives_fresh_as_rotten": false_positives,
            "false_positive_rate": None if fp_rate != fp_rate else fp_rate,
        },
    }
    report_path = out_dir / cfg["output"]["metrics_report_name"]
    with open(report_path, "w") as f:
        json.dump(full_report, f, indent=2, default=str)
    print(f"\nFull evaluation report saved to {report_path}")

    # ---- Honesty check ----
    print("\n" + "=" * 70)
    print("HONEST ASSESSMENT")
    print("=" * 70)
    if acc >= 0.90 and f1_macro >= 0.85:
        print(f"Model performs well on held-out test data (acc={acc:.3f}, macro-F1={f1_macro:.3f}).")
    elif acc >= 0.75:
        print(f"Model performs moderately (acc={acc:.3f}, macro-F1={f1_macro:.3f}). Usable for an MVP")
        print("demo but should not be presented as production-ready without further tuning")
        print("(more data, longer training, or a stronger backbone).")
    else:
        print(f"Model underperforms (acc={acc:.3f}, macro-F1={f1_macro:.3f}). Do NOT present this")
        print("as reliable. Check: class balance, learning rate, data quality/mislabeling,")
        print("or whether the val_f1 checkpoint actually converged.")


if __name__ == "__main__":
    main()
