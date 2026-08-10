"""
TAZA AI Service - Inference.

Two layers:
  1. `FreshnessPredictor.predict_image` - single image -> class, confidence,
     normalized 0-100 freshness score.
  2. `aggregate_batch_predictions` - combines 3-5 per-image predictions
     (as sampled from one physical produce batch) into one batch-level
     freshness estimate + confidence + explicit disagreement flag.

This module knows NOTHING about temperature/humidity/shelf-life/decisions.
It only turns pixels into a calibrated freshness signal. The next layer
(remaining-shelf-life model + decision engine) consumes its output as one
input among several - kept separate on purpose so each piece is testable
and swappable independently.
"""
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

import torch
import yaml
from PIL import Image

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from src.data.transforms import get_eval_transform
from src.models.classifier import build_model


@dataclass
class ImagePrediction:
    predicted_class: str          # e.g. "apple_fresh"
    confidence: float             # softmax prob of predicted class, 0-1
    freshness_score: float        # normalized 0-100, higher = fresher
    is_fresh: bool                # collapsed binary semantics
    class_probabilities: dict     # full distribution, for transparency/debugging


@dataclass
class BatchPrediction:
    freshness_score: float            # aggregated 0-100 batch-level score
    confidence: float                 # aggregated confidence, 0-1
    fresh_fraction: float             # fraction of sampled images classified fresh
    n_images: int
    per_image: List[ImagePrediction]
    high_disagreement: bool           # True if per-image predictions disagree a lot
    dominant_produce_type: Optional[str] = None
    notes: List[str] = field(default_factory=list)


def _label_is_fresh(label: str) -> bool:
    l = label.lower()
    if "fresh" in l:
        return True
    if any(k in l for k in ["rotten", "stale", "spoiled"]):
        return False
    raise ValueError(f"Cannot infer fresh/rotten semantics from label '{label}'")


def _produce_type_from_label(label: str) -> str:
    l = label.lower()
    for token in ["fresh", "rotten", "stale", "spoiled"]:
        l = l.replace(token, "")
    return l.strip("_") or "unknown"


class FreshnessPredictor:
    """Loads a trained checkpoint once; call predict_image/predict_batch repeatedly."""

    def __init__(self, model_path: str, config_path: str = "configs/train_config.yaml", device: Optional[str] = None):
        self.device = torch.device(device) if device else (
            torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        )

        with open(config_path) as f:
            self.cfg = yaml.safe_load(f)

        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)
        self.class_to_idx = checkpoint["class_to_idx"]
        self.idx_to_class = {int(k) if isinstance(k, str) else k: v for k, v in checkpoint["idx_to_class"].items()}

        self.model = build_model(
            checkpoint["architecture"], num_classes=checkpoint["num_classes"],
            pretrained=False, dropout=checkpoint["dropout"],
        )
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

        self.transform = get_eval_transform(self.cfg)
        self.fresh_anchor = self.cfg["freshness_score"]["fresh_anchor"]
        self.rotten_anchor = self.cfg["freshness_score"]["rotten_anchor"]

    def _score_from_prediction(self, predicted_class: str, confidence: float) -> float:
        """
        Freshness score design:
          - If predicted FRESH: score interpolates from the midpoint (50) up to
            fresh_anchor as confidence increases. A "fresh" call with only 55%
            confidence should NOT read as a rock-solid 90/100.
          - If predicted ROTTEN: mirror on the low end, down to rotten_anchor.
        This keeps confidence semantically embedded in the score rather than
        reporting a class-only score that hides model uncertainty.
        """
        is_fresh = _label_is_fresh(predicted_class)
        if is_fresh:
            score = 50 + (self.fresh_anchor - 50) * confidence
        else:
            score = 50 - (50 - self.rotten_anchor) * confidence
        return round(float(max(0, min(100, score))), 1)

    @torch.no_grad()
    def predict_image(self, image: Image.Image) -> ImagePrediction:
        image = image.convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        logits = self.model(tensor)
        probs = torch.softmax(logits, dim=1).squeeze(0).cpu()

        pred_idx = int(torch.argmax(probs).item())
        predicted_class = self.idx_to_class[pred_idx]
        confidence = float(probs[pred_idx].item())

        class_probabilities = {
            self.idx_to_class[i]: round(float(probs[i].item()), 4) for i in range(len(probs))
        }

        return ImagePrediction(
            predicted_class=predicted_class,
            confidence=round(confidence, 4),
            freshness_score=self._score_from_prediction(predicted_class, confidence),
            is_fresh=_label_is_fresh(predicted_class),
            class_probabilities=class_probabilities,
        )

    def predict_image_from_path(self, path: str) -> ImagePrediction:
        with Image.open(path) as img:
            return self.predict_image(img)

    def predict_batch(self, images: List[Image.Image]) -> BatchPrediction:
        """
        Aggregate 3-5 (or any N>=1) sampled images from one physical batch
        into a single batch-level estimate.

        Aggregation logic:
          - freshness_score: mean of per-image scores (robust, simple, explainable
            to non-ML stakeholders on the team - important for a hackathon demo).
          - confidence: mean of per-image confidences, penalized if predictions
            disagree heavily across images (a batch where images disagree is
            genuinely less certain than the average of two confident-but-conflicting
            calls would suggest).
          - high_disagreement flag: raised when fresh/rotten calls split across
            the sample, since that's the strongest signal of a mixed-quality
            batch (common in reality - some units rot before others).
        """
        if not images:
            raise ValueError("predict_batch requires at least one image")

        per_image = [self.predict_image(img) for img in images]

        scores = [p.freshness_score for p in per_image]
        confidences = [p.confidence for p in per_image]
        fresh_flags = [p.is_fresh for p in per_image]

        fresh_fraction = sum(fresh_flags) / len(fresh_flags)
        mean_score = sum(scores) / len(scores)
        mean_confidence = sum(confidences) / len(confidences)

        # Disagreement: not unanimous fresh/rotten across the sample
        high_disagreement = 0 < sum(fresh_flags) < len(fresh_flags)
        if high_disagreement:
            # widen uncertainty: disagreement is itself informative and should
            # pull reported confidence down, not just average raw per-image confidences
            disagreement_penalty = 0.15
            mean_confidence = max(0.0, mean_confidence - disagreement_penalty)

        produce_types = [_produce_type_from_label(p.predicted_class) for p in per_image]
        dominant_produce_type = max(set(produce_types), key=produce_types.count) if produce_types else None

        notes = []
        if high_disagreement:
            notes.append(
                f"Images disagree: {sum(fresh_flags)}/{len(fresh_flags)} classified fresh. "
                "This likely indicates a mixed-quality batch rather than a model error - "
                "consider flagging for partial sort/rescue rather than a single blanket action."
            )
        if mean_confidence < 0.6:
            notes.append("Mean confidence is low; consider requesting additional sample images.")

        return BatchPrediction(
            freshness_score=round(mean_score, 1),
            confidence=round(mean_confidence, 4),
            fresh_fraction=round(fresh_fraction, 4),
            n_images=len(images),
            per_image=per_image,
            high_disagreement=high_disagreement,
            dominant_produce_type=dominant_produce_type,
            notes=notes,
        )

    def predict_batch_from_paths(self, paths: List[str]) -> BatchPrediction:
        images = [Image.open(p).convert("RGB") for p in paths]
        return self.predict_batch(images)


def _prediction_to_dict(pred) -> dict:
    if isinstance(pred, ImagePrediction):
        return pred.__dict__
    if isinstance(pred, BatchPrediction):
        d = pred.__dict__.copy()
        d["per_image"] = [p.__dict__ for p in pred.per_image]
        return d
    raise TypeError(type(pred))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run inference on one or more images")
    parser.add_argument("images", nargs="+", help="Path(s) to image file(s)")
    parser.add_argument("--model", default="saved_models/freshness_classifier_best.pt")
    parser.add_argument("--config", default="configs/train_config.yaml")
    args = parser.parse_args()

    predictor = FreshnessPredictor(args.model, args.config)

    if len(args.images) == 1:
        result = predictor.predict_image_from_path(args.images[0])
    else:
        result = predictor.predict_batch_from_paths(args.images)

    print(json.dumps(_prediction_to_dict(result), indent=2, default=str))
