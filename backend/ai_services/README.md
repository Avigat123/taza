# FreshFlow OS - AI/ML Service (Stage 1: Computer Vision MVP)

Reduces fresh-produce waste by classifying batch images as fresh/rotten,
producing a normalized freshness score, and (in later stages) feeding a
deterministic SELL/DISCOUNT/REDISTRIBUTE/RESCUE decision engine.

This stage covers **only** the CV classifier, end-to-end, validated on a
synthetic smoke-test dataset. Next stages (shelf-life regression, decision
engine, FastAPI, agent) are scaffolded as empty folders but not yet built —
see `src/` structure below.

## 1. Folder structure

```
freshflow-ai/
├── configs/
│   └── train_config.yaml        # single source of truth: data, model, training, scoring
├── data/
│   ├── raw/                     # <- put the downloaded Kaggle dataset here
│   └── processed/                # (reserved for future preprocessing artifacts)
├── src/
│   ├── data/
│   │   ├── inspect_dataset.py   # STEP 1: run this first on any new dataset
│   │   ├── dataset.py           # stratified split + leakage checks + PyTorch Dataset
│   │   └── transforms.py        # train (augmented) vs eval (deterministic) transforms
│   ├── models/
│   │   └── classifier.py        # MobileNetV3 / MobileNetV2 / EfficientNet-B0 factory
│   ├── training/
│   │   ├── train.py             # two-phase transfer learning + early stopping
│   │   └── evaluate.py          # test-set metrics, confusion matrix, FN/FP analysis
│   ├── inference/
│   │   └── predict.py           # single-image + batch-level (3-5 img) aggregation
│   ├── api/                     # (next stage) FastAPI service
│   ├── decision/                # (next stage) shelf-life model + decision engine
│   └── agent/                   # (final stage) LLM orchestration agent
├── saved_models/                # best checkpoint + class mapping + metrics land here
├── scripts/
│   └── download_dataset.sh      # Kaggle CLI download helper
└── requirements.txt
```

## 2. Installation

```bash
cd freshflow-ai
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

pip install -r requirements.txt
```

If you have a CUDA GPU, install the matching torch build from
https://pytorch.org/get-started/locally/ instead of the default CPU wheel
pulled by requirements.txt — training will be much faster.

## 3. Get the dataset

Recommended baseline dataset (6 classes: apple/banana/orange × fresh/rotten,
~13.6k images, well-established benchmark):

```bash
# One-time: Kaggle account -> Settings -> API -> Create New Token
# -> place kaggle.json at ~/.kaggle/kaggle.json (chmod 600)

cd scripts
bash download_dataset.sh
```

This lands data under `data/raw/train/<class>/*.jpg` and `data/raw/test/<class>/*.jpg`
(the dataset ships with its own train/test split — our pipeline detects and
respects this automatically, only carving a validation set out of the
shipped train portion).

Stretch dataset (14 produce types, more classes, use for a stronger demo
once the baseline works): `muhammad0subhan/fruit-and-vegetable-disease-healthy-vs-rotten`
on Kaggle. Same code works — just point `raw_root` at it.

## 4. Run the pipeline, in order

```bash
# STEP 1 - Inspect the dataset BEFORE touching training code.
# Confirms class balance, shipped splits, label semantics, corrupt files.
python src/data/inspect_dataset.py --root data/raw

# STEP 2 - Train (two-phase: frozen-backbone warmup, then full fine-tune)
python -m src.training.train --config configs/train_config.yaml

# STEP 3 - Evaluate rigorously on the held-out TEST set only
python -m src.training.evaluate --config configs/train_config.yaml

# STEP 4 - Run inference
# Single image:
python -m src.inference.predict path/to/image.jpg

# Batch (3-5 images sampled from one physical produce batch):
python -m src.inference.predict img1.jpg img2.jpg img3.jpg img4.jpg
```

Training produces, in `saved_models/`:
- `freshness_classifier_best.pt` — checkpoint (weights + architecture + class
  mapping + everything needed to reload without the training code)
- `class_mapping.json`
- `splits_manifest.json` — exact train/val/test file lists (for reproducibility
  and so evaluate.py always scores the same held-out test set)
- `training_history.json` — per-epoch metrics

Evaluation produces:
- `evaluation_report.json` — accuracy, macro/weighted precision/recall/F1,
  per-class report, confusion matrix values, and a **critical error analysis**
  specifically for false negatives (rotten misclassified as fresh — the
  costly error for this product) vs false positives (fresh misclassified as
  rotten — wasteful but not dangerous)
- `confusion_matrix.png`

## 5. Design decisions worth knowing about

**Why MobileNetV3-Large as default:** ~4.2M trainable params in this config,
runs on CPU at usable inference latency (important — the FastAPI service may
not have GPU during the hackathon judging/demo). EfficientNet-B0 is available
as a one-line swap (`model.architecture` in the config) if you have GPU
headroom and want to chase a higher accuracy ceiling.

**Why two-phase training:** training a randomly-initialized head against a
frozen pretrained backbone first prevents large early gradients from
destroying useful pretrained features, before unfreezing for full fine-tuning
at a lower LR.

**Why macro-F1 for early stopping/checkpointing, not accuracy:** accuracy is
misleading under class imbalance, and this pipeline auto-detects imbalance
in `inspect_dataset.py`.

**Leakage prevention:**
1. If the raw dataset ships a train/test split, that split is respected as
   immutable — we never merge or reshuffle across it.
2. All splitting is stratified and done at the file level.
3. A hash-based duplicate check runs across the resulting splits and warns if
   the same image content appears in more than one split (catches datasets
   that contain accidental duplicates from web-scraping).
4. Train transforms include augmentation; val/test transforms are
   deterministic (resize+crop+normalize only) so evaluation is stable and
   not itself a source of leakage/optimism.

**Freshness score design (0-100):** the score is not just a hardcoded value
per class — it interpolates based on model confidence. A "fresh" prediction
at 55% confidence scores much lower than one at 99% confidence, and never
implies false certainty. See `FreshnessPredictor._score_from_prediction`.

**Batch-level aggregation (3-5 images per batch):** mean freshness score
across images, confidence penalized when fresh/rotten predictions disagree
across the sample (a real signal of a mixed-quality batch, not model noise),
and an explicit `high_disagreement` flag + human-readable notes so the
decision engine (and ultimately the LLM agent) can react appropriately
instead of silently averaging away a meaningful split.

## 6. What's honestly NOT done yet (by design — see task scope)

- `src/decision/` — remaining shelf-life regression (temp/humidity/duration
  features) and the deterministic SELL/DISCOUNT/REDISTRIBUTE/RESCUE engine
- `src/api/` — FastAPI wrapper exposing `predict_batch` over REST
- `src/agent/` — LLM orchestration agent (numbers only from ML/deterministic
  code, never invented by the LLM)

These are scaffolded as empty directories intentionally, per the "build
incrementally" instruction. Say the word and I'll build the next layer.

## 7. Known limitations to disclose honestly (update after real training run)

Run `evaluate.py` on the real dataset and paste the actual accuracy/F1/FN-rate
numbers here before presenting this as a finished component. Do not claim
production-grade accuracy without the real test-set report — the evaluation
script prints an explicit honesty check at the bottom of its output for
exactly this reason.
