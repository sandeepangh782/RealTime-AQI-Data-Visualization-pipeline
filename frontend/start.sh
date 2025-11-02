#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

export NPM_CONFIG_CACHE=${NPM_CONFIG_CACHE:-./.npm-cache}
echo "[frontend] Installing deps (cache=$NPM_CONFIG_CACHE) ..."
npm install

echo "[frontend] Starting Vite dev server on http://localhost:5173 ..."
npm run dev


