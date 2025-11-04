#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

python3 -m venv .venv || true
# shellcheck disable=SC1091
source .venv/bin/activate
# python -m pip install --upgrade pip -q
# pip install -r requirements.txt -q

export KAFKA_BOOTSTRAP=${KAFKA_BOOTSTRAP:-localhost:9092}
export AQI_TOPIC=${AQI_TOPIC:-air_quality_data}

echo "[producer] Bootstrap=$KAFKA_BOOTSTRAP topic=$AQI_TOPIC"
python producer.py


