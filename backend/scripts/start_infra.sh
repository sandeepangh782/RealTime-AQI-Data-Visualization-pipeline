#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT/backend"
echo "[infra] Starting Docker Compose services (Zookeeper, Kafka, Spark) ..."
docker compose up -d

echo "[infra] Creating Kafka topic if not exists ..."
docker compose exec -T kafka kafka-topics --bootstrap-server kafka:29092 --create --topic air_quality_data --if-not-exists || true
docker compose exec -T kafka kafka-topics --bootstrap-server kafka:29092 --list

echo "[infra] Kafka broker should be reachable at localhost:9092"
echo "Done."


