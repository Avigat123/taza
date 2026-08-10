"""
TAZA AI Service - Layer 1 access point.

Thin wrapper around `src.inference.predict.FreshnessPredictor` so the
orchestration endpoint (ai/api/analyze.py) can turn uploaded images into
a `CVAnalysis` object (ai.shelf_life.schema) without depending on training
paths directly. Loads the trained checkpoint once, at first use.

DOES NOT retrain or modify the existing classifier - only adapts its
existing output shape into what Layer 2 expects.
"""
import logging
import os
from collections import Counter
from pathlib import Path
from typing import List, Optional

from PIL import Image

from src.inference.predict import FreshnessPredictor, BatchPrediction

logger = logging.getLogger("taza.vision")

# Paths are relative to the ai_services/ working directory, matching how
# the existing CLI in src/inference/predict.py is invoked and how
# ai/main.py resolves ai/.env.
_DEFAULT_MODEL_PATH = os.environ.get(
    "FRESHNESS_MODEL_PATH", "saved_models/freshness_classifier_best.pt"
)
_DEFAULT_CONFIG_PATH = os.environ.get(
    "FRESHNESS_CONFIG_PATH", "configs/train_config.yaml"
)

# Maps the classifier's plural label stems (from class_mapping.json:
# freshapples/rottenapples, freshbanana/rottenbanana,
# freshoranges/rottenoranges) to the singular produce keys used by Layer 2
# (ai.shelf_life.schema.SUPPORTED_PRODUCE = {"apple", "banana", "orange"}).
_LABEL_STEM_TO_PRODUCE = {
    "apples": "apple",
    "banana": "banana",
    "oranges": "orange",
}

_predictor: Optional[FreshnessPredictor] = None


def get_predictor() -> FreshnessPredictor:
    global _predictor
    if _predictor is None:
        logger.info(
            f"Loading freshness classifier from {_DEFAULT_MODEL_PATH} "
            f"(config={_DEFAULT_CONFIG_PATH})"
        )
        _predictor = FreshnessPredictor(_DEFAULT_MODEL_PATH, _DEFAULT_CONFIG_PATH)
    return _predictor


def _produce_from_label(label: str) -> str:
    stem = label.lower()
    for token in ("fresh", "rotten", "stale", "spoiled"):
        stem = stem.replace(token, "")
    stem = stem.strip("_")
    return _LABEL_STEM_TO_PRODUCE.get(stem, stem)


def run_cv_on_images(images: List[Image.Image]) -> BatchPrediction:
    """Runs Layer 1 inference on a set of sampled images from one physical
    batch. Raises ValueError if `images` is empty (caller should turn this
    into a 422 before it reaches here)."""
    predictor = get_predictor()
    return predictor.predict_batch(images)


def batch_prediction_to_cv_analysis(prediction: BatchPrediction) -> dict:
    """Adapts a Layer 1 BatchPrediction into the dict shape Layer 2's
    CVAnalysis (ai.shelf_life.schema) expects: dominant class label,
    aggregated freshness/confidence, and a class distribution that sums to
    ~1.0 over ALL classes seen in the sample (not just the dominant one) -
    Layer 2's determine_batch_condition() reads rotten_fraction from this."""
    counts = Counter(p.predicted_class for p in prediction.per_image)
    total = sum(counts.values())
    class_distribution = {cls: round(n / total, 4) for cls, n in counts.items()}
    dominant_class = counts.most_common(1)[0][0] if counts else None

    return {
        "visual_class": dominant_class,
        "freshness_score": prediction.freshness_score,
        "confidence": prediction.confidence,
        "class_distribution": class_distribution,
        "high_disagreement": prediction.high_disagreement,
    }


def dominant_produce_type(prediction: BatchPrediction) -> Optional[str]:
    if not prediction.dominant_produce_type:
        return None
    return _produce_from_label(prediction.dominant_produce_type)
