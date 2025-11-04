import json
import os
from typing import Any

import requests
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType


KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC = os.getenv("CRYPTO_TOPIC", "crypto_market_data")
BACKEND_INGEST_URL = os.getenv("BACKEND_INGEST_URL", "http://localhost:8000/ingest")


def create_spark() -> SparkSession:
    return (
        SparkSession.builder.appName("Crypto-Market-Consumer")
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
            StructField("coin", StringType(), False),
            StructField("price", DoubleType(), False),
            StructField("change_24h", DoubleType(), False),
            StructField("volume_24h", DoubleType(), False),
            StructField("market_cap", DoubleType(), False),
            StructField("timestamp", StringType(), False),
        ]
    )

    parsed = df.select(F.col("value").cast("string").alias("json"))
    parsed = parsed.select(F.from_json(F.col("json"), schema).alias("data")).select("data.*")

    # Convert timestamp to proper timestamp type
    parsed = parsed.withColumn(
        "event_time",
        F.coalesce(
            F.to_timestamp(F.col("timestamp"), "yyyy-MM-dd'T'HH:mm:ssXXX"),
            F.current_timestamp(),
        ),
    )
    return parsed


def map_volatility_status(change_pct_col: Any) -> Any:
    """Map 24h price change to volatility status."""
    abs_change = F.abs(change_pct_col)
    return (
        F.when(abs_change <= 2, F.lit("Stable"))
        .when(abs_change <= 5, F.lit("Moving"))
        .when(abs_change <= 10, F.lit("Volatile"))
        .when(abs_change <= 20, F.lit("High Volatility"))
        .otherwise(F.lit("Extreme"))
    )


def map_trend(change_pct_col: Any) -> Any:
    """Map price change to trend direction."""
    return (
        F.when(change_pct_col > 5, F.lit("🚀 Surging"))
        .when(change_pct_col > 2, F.lit("📈 Rising"))
        .when(change_pct_col > -2, F.lit("➡️ Stable"))
        .when(change_pct_col > -5, F.lit("📉 Falling"))
        .otherwise(F.lit("💥 Crashing"))
    )


def get_coin_symbol(coin_id: str) -> str:
    """Convert coin ID to display symbol."""
    mapping = {
        "bitcoin": "BTC",
        "ethereum": "ETH",
        "binancecoin": "BNB",
        "solana": "SOL",
        "cardano": "ADA",
        "ripple": "XRP",
        "polkadot": "DOT",
        "dogecoin": "DOGE",
        "avalanche-2": "AVAX",
        "chainlink": "LINK",
    }
    return mapping.get(coin_id, coin_id.upper()[:4])


def process_stream(spark: SparkSession) -> None:
    print(f"[consumer] 💱 Crypto Consumer starting")
    print(f"[consumer] kafka={KAFKA_BOOTSTRAP} topic={TOPIC} ingest={BACKEND_INGEST_URL}")
    
    kafka_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
        .option("subscribe", TOPIC)
        .option("startingOffsets", "latest")
        .load()
    )

    parsed = parse_messages(kafka_df)
    print("[consumer] stream initialized. awaiting crypto data...")

    # Aggregate over 30-second windows (matches producer interval)
    agg = (
        parsed
        .groupBy(F.window("event_time", "30 seconds"), F.col("coin"))
        .agg(
            F.avg("price").alias("avg_price"),
            F.avg("change_24h").alias("avg_change_24h"),
            F.avg("volume_24h").alias("avg_volume"),
        )
        .select(
            F.col("coin"),
            F.round(F.col("avg_price"), 2).alias("price"),
            F.round(F.col("avg_change_24h"), 2).alias("change_24h"),
            F.round(F.col("avg_volume"), 0).cast("long").alias("volume_24h"),
            F.col("window.start").cast("timestamp").alias("ts")
        )
        .withColumn("volatility", map_volatility_status(F.col("change_24h")))
        .withColumn("trend", map_trend(F.col("change_24h")))
    )

    def send_batch(batch_df: DataFrame, batch_id: int) -> None:
        count = batch_df.count()
        print(f"[consumer] 📦 micro-batch id={batch_id} rows={count}")
        
        records = []
        for r in batch_df.collect():
            if r["coin"] is not None:
                symbol = get_coin_symbol(r["coin"])
                records.append({
                    "coin": symbol,
                    "coin_id": r["coin"],
                    "price": float(r["price"]) if r["price"] is not None else 0.0,
                    "change_24h": float(r["change_24h"]) if r["change_24h"] is not None else 0.0,
                    "volume_24h": int(r["volume_24h"]) if r["volume_24h"] is not None else 0,
                    "volatility": r["volatility"],
                    "trend": r["trend"],
                    "timestamp": r["ts"].strftime("%Y-%m-%dT%H:%M:%SZ") if r["ts"] else None,
                })
        
        if records:
            print(f"[consumer] 📤 posting {len(records)} records -> {BACKEND_INGEST_URL}")
            try:
                resp = requests.post(BACKEND_INGEST_URL, json={"data": records}, timeout=30)
                print(f"[consumer] ✓ ingest response status={resp.status_code}")
            except Exception as e:
                print(f"[consumer] ✗ ingest error: {e}")

    # Debug stream
    def debug_batch(df: DataFrame, batch_id: int) -> None:
        cnt = df.count()
        if cnt > 0:
            sample = [
                {
                    "coin": get_coin_symbol(row["coin"]),
                    "price": f"${row['price']:.2f}",
                    "change": f"{row['change_24h']:.2f}%"
                }
                for row in df.select("coin", "price", "change_24h").limit(3).collect()
            ]
        else:
            sample = []
        print(f"[consumer] 🔍 RAW batch id={batch_id} rows={cnt} sample={sample}")

    debug_query = parsed.writeStream.outputMode("append").foreachBatch(debug_batch).start()

    query = (
        agg.writeStream
        .outputMode("update")
        .trigger(processingTime="30 seconds")
        .foreachBatch(send_batch)
        .start()
    )
    
    query.awaitTermination()
    debug_query.awaitTermination()


if __name__ == "__main__":
    spark = create_spark()
    process_stream(spark)


