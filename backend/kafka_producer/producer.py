import json
import os
import random
import time
from datetime import datetime, timezone

from kafka import KafkaProducer
from kafka.errors import KafkaError


TOPIC = os.getenv("AQI_TOPIC", "air_quality_data")
BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")

CITIES = [
    "Delhi",
    "Mumbai",
    "Bengaluru",
    "Kolkata",
    "Chennai",
    "Hyderabad",
    "Pune",
]


def create_producer() -> KafkaProducer:
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            producer = KafkaProducer(
                bootstrap_servers=BOOTSTRAP,
                value_serializer=lambda v: json.dumps(v).encode("utf-8"),
                linger_ms=50,
                retries=5,
                acks=0,
                request_timeout_ms=30000,
                max_block_ms=30000,
                api_version=(0, 10, 1),
            )
            # Test connection
            producer.bootstrap_connected()
            print(f"✓ Connected to Kafka at {BOOTSTRAP}")
            return producer
        except Exception as e:
            print(f"Attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise


def generate_aqi() -> int:
    base = random.randint(40, 200)
    noise = random.randint(-10, 10)
    return max(0, base + noise)


def main() -> None:
    producer = create_producer()
    print(f"Producing to {BOOTSTRAP} topic={TOPIC}")
    try:
        while True:
            city = random.choice(CITIES)
            payload = {
                "city": city,
                "aqi": generate_aqi(),
                "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            }
            future = producer.send(TOPIC, value=payload)
            # Wait for send to complete and check for errors
            try:
                record_metadata = future.get(timeout=2)
                print("->", payload, f"[offset={record_metadata.offset}]")
            except Exception as e:
                print(f"ERROR sending message: {e}")
            # small random jitter for more lifelike stream
            time.sleep(random.uniform(0.3, 1.2))
    finally:
        producer.flush()
        producer.close()


if __name__ == "__main__":
    main()   