#!/bin/bash
# TAZA AI Service - Dataset download
# Requires: pip install kaggle, and ~/.kaggle/kaggle.json API token
# (Kaggle account -> Settings -> Create New Token)

set -e

DATA_DIR="../data/raw"
mkdir -p "$DATA_DIR"
cd "$DATA_DIR"

echo "Downloading fruits-fresh-and-rotten-for-classification..."
kaggle datasets download -d sriramr/fruits-fresh-and-rotten-for-classification -p . --unzip

echo "Done. Contents:"
find . -maxdepth 3 -type d | sort
echo ""
echo "Image counts per class:"
find . -mindepth 2 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) \
  | awk -F/ '{print $(NF-1)}' | sort | uniq -c
