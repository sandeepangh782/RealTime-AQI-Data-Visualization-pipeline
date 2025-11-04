#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

python3 -m venv .venv || true
# shellcheck disable=SC1091
source .venv/bin/activate
# python -m pip install --upgrade pip
# pip install -r requirements.txt

export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-8000}

echo "[api] Starting FastAPI on http://$HOST:$PORT ..."
uvicorn app:app --host "$HOST" --port "$PORT" --reload


