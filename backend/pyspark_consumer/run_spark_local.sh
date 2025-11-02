#!/usr/bin/env bash
set -euo pipefail

# Runs the consumer locally with the installed PySpark

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ -d .venv ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

python spark_consumer.py


