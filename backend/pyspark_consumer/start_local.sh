#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

python3 -m venv .venv || true
# shellcheck disable=SC1091
source .venv/bin/activate
# python -m pip install --upgrade pip
# pip install -r requirements.txt

export KAFKA_BOOTSTRAP=${KAFKA_BOOTSTRAP:-localhost:9092}
export AQI_TOPIC=${AQI_TOPIC:-air_quality_data}
export BACKEND_INGEST_URL=${BACKEND_INGEST_URL:-http://localhost:8000/ingest}

echo "[spark-consumer] Using $KAFKA_BOOTSTRAP topic=$AQI_TOPIC -> $BACKEND_INGEST_URL"
./run_spark_local.sh


