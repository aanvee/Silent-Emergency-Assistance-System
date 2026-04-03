#!/usr/bin/env bash
# Exit on error
set -o errexit

pip install --upgrade pip
pip install -r backend/requirements.txt

# Download TextBlob corpora
python -m textblob.download_corpora
