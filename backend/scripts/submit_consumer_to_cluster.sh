#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

CONSUMER_LOCAL="$REPO_ROOT/backend/pyspark_consumer/spark_consumer.py"
CONSUMER_REMOTE="/tmp/app/spark_consumer.py"

KAFKA_BOOTSTRAP=${KAFKA_BOOTSTRAP:-kafka:29092}
AQI_TOPIC=${AQI_TOPIC:-air_quality_data}
BACKEND_INGEST_URL=${BACKEND_INGEST_URL:-http://host.docker.internal:8000/ingest}

echo "[cluster-submit] Ensuring target dirs exist in spark-master ..."
docker compose -f "$REPO_ROOT/backend/docker-compose.yml" exec -T spark-master bash -lc "mkdir -p $(dirname \"$CONSUMER_REMOTE\") && mkdir -p /tmp/.ivy2 && chmod -R 777 /tmp/.ivy2 $(dirname \"$CONSUMER_REMOTE\")"

echo "[cluster-submit] Copying consumer to spark-master ..."
docker compose -f "$REPO_ROOT/backend/docker-compose.yml" cp "$CONSUMER_LOCAL" spark-master:"$CONSUMER_REMOTE"

echo "[cluster-submit] Submitting job to spark cluster ..."
docker compose -f "$REPO_ROOT/backend/docker-compose.yml" exec -T spark-master \
  /opt/spark/bin/spark-submit \
  --master spark://spark-master:7077 \
  --conf spark.sql.shuffle.partitions=4 \
  --conf spark.jars.ivy=/tmp/.ivy2 \
  --conf spark.executorEnv.KAFKA_BOOTSTRAP="$KAFKA_BOOTSTRAP" \
  --conf spark.executorEnv.AQI_TOPIC="$AQI_TOPIC" \
  --conf spark.executorEnv.BACKEND_INGEST_URL="$BACKEND_INGEST_URL" \
  --conf spark.driver.extraJavaOptions=-Dio.netty.tryReflectionSetAccessible=true \
  --conf spark.executor.extraJavaOptions=-Dio.netty.tryReflectionSetAccessible=true \
  --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.apache.kafka:kafka-clients:3.5.1 \
  "$CONSUMER_REMOTE"


