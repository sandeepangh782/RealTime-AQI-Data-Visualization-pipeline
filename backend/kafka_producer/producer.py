import json
import os
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional

import requests
from kafka import KafkaProducer
from kafka.errors import KafkaError


TOPIC = os.getenv("CRYPTO_TOPIC", "crypto_market_data")
BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")

# Top cryptocurrencies to track
COINS = [
    "bitcoin",
    "ethereum",
    "binancecoin",
    "solana",
    "cardano",
    "ripple",
    "polkadot",
    "dogecoin",
    "avalanche-2",
    "chainlink",
]

COINGECKO_API = "https://api.coingecko.com/api/v3/simple/price"


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


def fetch_crypto_data() -> Optional[List[Dict]]:
    """Fetch live crypto data from CoinGecko API with retry logic."""
    max_retries = 3
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            params = {
                "ids": ",".join(COINS),
                "vs_currencies": "usd",
                "include_24hr_change": "true",
                "include_24hr_vol": "true",
                "include_market_cap": "true",
            }
            response = requests.get(COINGECKO_API, params=params, timeout=10)
            
            # Check for rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                print(f"⚠️  Rate limited! Waiting {retry_after}s before retry...")
                time.sleep(retry_after)
                continue
                
            response.raise_for_status()
            data = response.json()
            
            # Transform to our format
            records = []
            for coin_id, coin_data in data.items():
                records.append({
                    "coin": coin_id,
                    "price": coin_data.get("usd", 0),
                    "change_24h": coin_data.get("usd_24h_change", 0),
                    "volume_24h": coin_data.get("usd_24h_vol", 0),
                    "market_cap": coin_data.get("usd_market_cap", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                })
            return records
            
        except requests.exceptions.RequestException as e:
            wait_time = base_delay * (2 ** attempt)  # Exponential backoff
            print(f"⚠️  API error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                print(f"   Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"   Failed after {max_retries} attempts")
                return None
        except Exception as e:
            print(f"⚠️  Unexpected error: {e}")
            return None
    
    return None


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


def main() -> None:
    producer = create_producer()
    print(f"💱 Crypto Market Producer starting...")
    print(f"📡 Kafka: {BOOTSTRAP} | Topic: {TOPIC}")
    print(f"🪙  Tracking: {len(COINS)} coins")
    print(f"🔄 Fetching from CoinGecko API every 30 seconds (free tier)\n")
    
    try:
        while True:
            crypto_data = fetch_crypto_data()
            
            if crypto_data:
                for record in crypto_data:
                    symbol = get_coin_symbol(record["coin"])
                    try:
                        future = producer.send(TOPIC, value=record)
                        future.get(timeout=2)
                        print(f"✓ {symbol:5s} ${record['price']:>10,.2f} | "
                              f"Δ24h: {record['change_24h']:>6.2f}% | "
                              f"Vol: ${record['volume_24h']/1e9:>6.2f}B")
                    except Exception as e:
                        print(f"✗ ERROR sending {symbol}: {e}")
                
                print(f"─── Sent {len(crypto_data)} records ───\n")
            else:
                print("⏭️  Skipping batch due to API error\n")
            
            # CoinGecko free tier: rate limited to ~10-15 calls/min
            # Using 30s interval = 2 calls/min to stay well within limits
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down gracefully...")
    finally:
        producer.flush()
        producer.close()
        print("✓ Producer closed")


if __name__ == "__main__":
    main()   