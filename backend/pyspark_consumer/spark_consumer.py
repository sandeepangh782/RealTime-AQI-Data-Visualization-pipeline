import json
import os
from typing import Any

import requests
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType


KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC = os.getenv("AQI_TOPIC", "air_quality_data")
BACKEND_INGEST_URL = os.getenv("BACKEND_INGEST_URL", "http://localhost:8000/ingest")


def create_spark() -> SparkSession:
    return (
        SparkSession.builder.appName("AQI-Streaming-Consumer")
        .config("spark.sql.shuffle.partitions", "4")
        # Enable Kafka source/ sink for Structured Streaming
        .config(
            "spark.jars.packages",
            "org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.apache.kafka:kafka-clients:3.5.1",
        )
        .getOrCreate()
    )


def parse_messages(df: DataFrame) -> DataFrame:
    schema = StructType(
        [
            StructField("city", StringType(), False),
            StructField("aqi", IntegerType(), False),
            StructField("timestamp", StringType(), False),
        ]
    )

    parsed = df.select(F.col("value").cast("string").alias("json"))
    parsed = parsed.select(F.from_json(F.col("json"), schema).alias("data")).select("data.*")

    # Convert timestamp to proper timestamp type
    # Parse ISO8601 with 'Z' timezone correctly; fallback to current_timestamp if parse fails
    parsed = parsed.withColumn(
        "event_time",
        F.coalesce(
            F.to_timestamp(F.col("timestamp"), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            F.current_timestamp(),
        ),
    )
    return parsed


def map_status(avg_aqi_col: Any) -> Any:
    return (
        F.when(avg_aqi_col <= 50, F.lit("Good"))
        .when(avg_aqi_col <= 100, F.lit("Moderate"))
        .when(avg_aqi_col <= 150, F.lit("Unhealthy for Sensitive"))
        .when(avg_aqi_col <= 200, F.lit("Unhealthy"))
        .when(avg_aqi_col <= 300, F.lit("Very Unhealthy"))
        .otherwise(F.lit("Hazardous"))
    )


def process_stream(spark: SparkSession) -> None:
    print(f"[consumer] starting. kafka={KAFKA_BOOTSTRAP} topic={TOPIC} ingest={BACKEND_INGEST_URL}")
    kafka_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
        .option("subscribe", TOPIC)
        .option("startingOffsets", "latest")
        .load()
    )

    parsed = parse_messages(kafka_df)
    print("[consumer] stream initialized. awaiting records ...")

    agg = (
        parsed
        .groupBy(F.window("event_time", "5 seconds"), F.col("city"))
        .agg(F.avg("aqi").alias("avg_aqi"))
        .select(
            F.col("city"),
            F.round(F.col("avg_aqi"), 0).cast("int").alias("avg_aqi"),
            F.col("window.start").cast("timestamp").alias("ts")
        )
        .withColumn("status", map_status(F.col("avg_aqi")))
    )

    def send_batch(batch_df: DataFrame, batch_id: int) -> None:
        count = batch_df.count()
        print(f"[consumer] micro-batch id={batch_id} rows={count}")
        records = [
            {
                "city": r["city"],
                "avg_aqi": int(r["avg_aqi"]) if r["avg_aqi"] is not None else 0,
                "status": r["status"],
                "timestamp": r["ts"].strftime("%Y-%m-%dT%H:%M:%SZ") if r["ts"] else None,
            }
            for r in batch_df.collect()
            if r["city"] is not None  # Filter out null records
        ]
        if records:
            print(f"[consumer] posting {len(records)} records -> {BACKEND_INGEST_URL}")
            try:
                resp = requests.post(BACKEND_INGEST_URL, json={"data": records}, timeout=10)
                print(f"[consumer] ingest response status={resp.status_code}")
            except Exception as e:
                print("[consumer] ingest error:", e)

    # Debug stream on parsed to ensure records are flowing from Kafka
    def debug_batch(df: DataFrame, batch_id: int) -> None:
        cnt = df.count()
        if cnt > 0:
            sample = [row.asDict() for row in df.select("city", "aqi", "timestamp").limit(3).collect()]
        else:
            sample = []
        print(f"[consumer] RAW batch id={batch_id} rows={cnt} sample={sample}")

    debug_query = parsed.writeStream.outputMode("append").foreachBatch(debug_batch).start()

    query = (
        agg.writeStream.outputMode("update").trigger(processingTime="5 seconds").foreachBatch(send_batch).start()
    )
    query.awaitTermination()
    debug_query.awaitTermination()


if __name__ == "__main__":
    spark = create_spark()
    process_stream(spark)


