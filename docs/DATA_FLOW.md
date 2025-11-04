# 🔄 Data Flow & Format Specification

## Overview

This document details the **exact data formats**, **transformations**, and **flow** at each stage of the pipeline, from CoinGecko API response to frontend display.

---

## Pipeline Stages

```
Stage 1: CoinGecko API
   ↓
Stage 2: Kafka Producer (Transform & Publish)
   ↓
Stage 3: Kafka Topic (Message Queue)
   ↓
Stage 4: Spark Consumer (Aggregate & Enrich)
   ↓
Stage 5: FastAPI Server (Broadcast)
   ↓
Stage 6: React Frontend (Render)
```

---

## Stage 1: CoinGecko API Response

### Endpoint

```
GET https://api.coingecko.com/api/v3/simple/price
```

### Query Parameters

```json
{
  "ids": "bitcoin,ethereum,binancecoin,solana,ripple,cardano,dogecoin,polkadot,avalanche-2,chainlink",
  "vs_currencies": "usd",
  "include_24hr_change": "true",
  "include_24hr_vol": "true",
  "include_market_cap": "true"
}
```

### Raw Response Format

```json
{
  "bitcoin": {
    "usd": 103895,
    "usd_24h_change": 3.456789,
    "usd_24h_vol": 45678901234.56,
    "usd_market_cap": 2034567890123.45
  },
  "ethereum": {
    "usd": 3492.61,
    "usd_24h_change": -2.345678,
    "usd_24h_vol": 23456789012.34,
    "usd_market_cap": 420123456789.12
  },
  ...
}
```

### Data Types

| Field | Type | Example | Notes |
|-------|------|---------|-------|
| `usd` | `float` | `103895.0` | Current price in USD |
| `usd_24h_change` | `float` | `3.456789` | Percentage change (not decimal) |
| `usd_24h_vol` | `float` | `45678901234.56` | 24h trading volume in USD |
| `usd_market_cap` | `float` | `2034567890123.45` | Market capitalization in USD |

---

## Stage 2: Kafka Producer Transformation

### Code Location
`backend/kafka_producer/producer.py` → `fetch_crypto_data()`

### Transformation Logic

```python
records = []
for coin_id, coin_data in api_response.items():
    records.append({
        "coin": coin_id,
        "price": coin_data.get("usd", 0),
        "change_24h": coin_data.get("usd_24h_change", 0),
        "volume_24h": coin_data.get("usd_24h_vol", 0),
        "market_cap": coin_data.get("usd_market_cap", 0),
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
```

### Output Format (Per Record)

```json
{
  "coin": "bitcoin",
  "price": 103895.0,
  "change_24h": 3.456789,
  "volume_24h": 45678901234.56,
  "market_cap": 2034567890123.45,
  "timestamp": "2025-11-04T17:45:30Z"
}
```

### Key Changes

1. **Coin ID**: Changed from nested key to `coin` field
2. **Field Renaming**: `usd` → `price`, `usd_24h_change` → `change_24h`
3. **Timestamp Addition**: Added UTC timestamp in ISO 8601 format
4. **Flattening**: One API response → 10 separate records (one per coin)

### Kafka Message Format

```json
{
  "key": "bitcoin",
  "value": "{\"coin\": \"bitcoin\", \"price\": 103895.0, ...}",
  "topic": "crypto_market_data",
  "partition": 0
}
```

---

## Stage 3: Kafka Topic Storage

### Topic Configuration

| Property | Value |
|----------|-------|
| **Name** | `crypto_market_data` |
| **Partitions** | 1 |
| **Replication Factor** | 1 |
| **Retention** | 7 days (default) |
| **Compression** | None |

### Message Ordering

- Messages within a partition are **strictly ordered** by offset
- Key: `coin` (ensures same coin goes to same partition if multi-partition)
- Value: JSON string (serialized record)

### Throughput

- **Producer Rate**: 10 records every 30 seconds = **0.33 records/sec**
- **Daily Volume**: ~28,800 records/day
- **Message Size**: ~200 bytes per record
- **Daily Data**: ~5.6 MB/day

---

## Stage 4: Spark Consumer Processing

### Code Location
`backend/pyspark_consumer/spark_consumer.py`

### 4.1: Read Stream

```python
raw_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", KAFKA_BROKER) \
    .option("subscribe", TOPIC) \
    .option("startingOffsets", "latest") \
    .load()
```

### 4.2: Parse JSON

```python
schema = StructType([
    StructField("coin", StringType(), False),
    StructField("price", DoubleType(), False),
    StructField("change_24h", DoubleType(), False),
    StructField("volume_24h", DoubleType(), False),
    StructField("market_cap", DoubleType(), False),
    StructField("timestamp", StringType(), False),
])

parsed_df = raw_stream.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")
```

### 4.3: Windowed Aggregation

```python
windowed_df = parsed_df \
    .withWatermark("timestamp", "1 minute") \
    .groupBy(
        window(col("timestamp"), "30 seconds"),
        col("coin")
    ) \
    .agg(
        F.avg("price").alias("price"),
        F.avg("change_24h").alias("change_24h"),
        F.max("volume_24h").alias("volume_24h"),
        F.first("market_cap").alias("market_cap"),
        F.first("timestamp").alias("timestamp")
    )
```

### Aggregation Logic

| Field | Aggregation | Reason |
|-------|-------------|--------|
| `price` | `AVG()` | Smooth out minor fluctuations |
| `change_24h` | `AVG()` | Average change within window |
| `volume_24h` | `MAX()` | Take highest volume seen |
| `market_cap` | `FIRST()` | Use first value (rarely changes) |
| `timestamp` | `FIRST()` | Use earliest timestamp in window |

### 4.4: Enrichment

```python
enriched_df = windowed_df \
    .withColumn("volatility", map_volatility_status(col("change_24h"))) \
    .withColumn("trend", map_trend(col("change_24h")))
```

**Volatility Mapping**:
```python
def map_volatility_status(change):
    abs_change = abs(change)
    if abs_change <= 2:  return "Stable"
    if abs_change <= 5:  return "Moving"
    if abs_change <= 10: return "Volatile"
    if abs_change <= 20: return "High Volatility"
    return "Extreme"
```

**Trend Mapping**:
```python
def map_trend(change):
    if change > 5:   return "🚀 Surging"
    if change > 2:   return "📈 Rising"
    if change > -2:  return "➡️ Stable"
    if change > -5:  return "📉 Falling"
    return "💥 Crashing"
```

### 4.5: Output Format (Batch)

```json
{
  "data": [
    {
      "coin": "bitcoin",
      "coin_id": "BTC",
      "price": 103895.0,
      "change_24h": 3.45,
      "volume_24h": 45678901234.56,
      "volatility": "Moving",
      "trend": "📈 Rising",
      "timestamp": "2025-11-04T17:45:30Z"
    },
    {
      "coin": "ethereum",
      "coin_id": "ETH",
      "price": 3492.61,
      "change_24h": -2.34,
      "volume_24h": 23456789012.34,
      "volatility": "Stable",
      "trend": "➡️ Stable",
      "timestamp": "2025-11-04T17:45:30Z"
    },
    ...
  ]
}
```

### Key Changes

1. **Aggregation**: Multiple records per coin within window → single aggregated record
2. **New Fields**: `volatility`, `trend` (computed)
3. **Coin ID**: Added `coin_id` (display name, e.g., "BTC")
4. **Rounding**: `change_24h` rounded to 2 decimals

---

## Stage 5: FastAPI Server Broadcasting

### Code Location
`backend/api_server/app.py`

### 5.1: Receive from Spark

```python
@app.post("/ingest")
async def ingest(payload: IngestPayload):
    # payload.data is list of crypto records
    asyncio.create_task(
        manager.broadcast_json({
            "type": "aqi_update",
            "data": payload.data
        })
    )
    return {"count": len(payload.data)}
```

### 5.2: WebSocket Broadcast

```python
async def broadcast_json(self, message: Dict):
    for ws in self._connections:
        try:
            await asyncio.wait_for(
                ws.send_json(message), 
                timeout=2.0
            )
        except asyncio.TimeoutError:
            # Drop slow client
            pass
```

### WebSocket Message Format

```json
{
  "type": "aqi_update",
  "data": [
    {
      "coin": "bitcoin",
      "coin_id": "BTC",
      "price": 103895.0,
      "change_24h": 3.45,
      "volume_24h": 45678901234.56,
      "volatility": "Moving",
      "trend": "📈 Rising",
      "timestamp": "2025-11-04T17:45:30Z"
    },
    ...
  ]
}
```

### Message Size

- **Per coin record**: ~200 bytes
- **10 coins**: ~2 KB
- **WebSocket overhead**: ~50 bytes
- **Total per message**: ~2 KB

---

## Stage 6: React Frontend Processing

### Code Location
`frontend/src/pages/Dashboard.jsx`

### 6.1: Receive WebSocket Message

```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  
  if (msg.type === 'aqi_update') {
    setUpdates(msg.data)  // Store latest data
    
    // Update price history
    setPriceHistory(prev => {
      const updated = { ...prev }
      msg.data.forEach(item => {
        if (!updated[item.coin]) {
          updated[item.coin] = []
        }
        updated[item.coin].push({
          timestamp: new Date(item.timestamp),
          price: item.price,
          change: item.change_24h
        })
        // Keep only last 20 points
        if (updated[item.coin].length > 20) {
          updated[item.coin] = updated[item.coin].slice(-20)
        }
      })
      return updated
    })
  }
}
```

### 6.2: Market Statistics Calculation

```javascript
const marketStats = useMemo(() => {
  const totalVolume = updates.reduce((sum, u) => sum + u.volume_24h, 0)
  const avgChange = updates.reduce((sum, u) => sum + u.change_24h, 0) / updates.length
  
  const rising = updates.filter(u => u.change_24h > 2).length
  const falling = updates.filter(u => u.change_24h < -2).length
  const stable = updates.filter(u => Math.abs(u.change_24h) <= 2).length
  const volatile = updates.filter(u => u.volatility.includes('Volatile')).length
  
  return { totalVolume, avgChange, rising, falling, stable, volatile }
}, [updates])
```

### 6.3: Display Formatting

**Price Formatting** (D3.js):
```javascript
const formatPrice = (d) => {
  if (d >= 1000) return `$${(d/1000).toFixed(d >= 10000 ? 0 : 1)}K`
  if (d >= 1) return `$${d.toFixed(0)}`
  return `$${d.toFixed(2)}`
}
```

**Examples**:
- `103895` → `$103.9K`
- `3492.61` → `$3493`
- `0.5432` → `$0.54`

**Volume Formatting**:
```javascript
const formatVolume = (volume) => {
  if (volume >= 1e12) return `$${(volume/1e12).toFixed(2)}T`
  if (volume >= 1e9) return `$${(volume/1e9).toFixed(2)}B`
  if (volume >= 1e6) return `$${(volume/1e6).toFixed(2)}M`
  return `$${volume.toFixed(0)}`
}
```

**Examples**:
- `45678901234.56` → `$45.68B`
- `23456789012.34` → `$23.46B`

---

## Data Type Transformations

### Throughout Pipeline

| Stage | Coin ID | Price | Change | Timestamp |
|-------|---------|-------|--------|-----------|
| **CoinGecko** | `bitcoin` (key) | `float` | `float` | N/A |
| **Producer** | `"bitcoin"` | `float` | `float` | `"2025-11-04T17:45:30Z"` |
| **Kafka** | `"bitcoin"` | `string` (JSON) | `string` | `string` |
| **Spark Parse** | `String` | `Double` | `Double` | `String` |
| **Spark Agg** | `String` | `Double` | `Double` | `String` |
| **FastAPI** | `str` | `float` | `float` | `str` |
| **React** | `string` | `number` | `number` | `Date` object |

---

## Timestamp Handling

### Producer (Python)
```python
datetime.now(timezone.utc).isoformat(timespec="seconds")
# Output: "2025-11-04T17:45:30Z"
```

### Spark (Scala/Java)
```python
# Parsed as String (no conversion needed)
timestamp_col = col("timestamp")  # Type: StringType
```

### React (JavaScript)
```javascript
new Date(item.timestamp)
// Input: "2025-11-04T17:45:30Z"
// Output: Date object in local timezone
```

### Display (React)
```javascript
new Date().toLocaleTimeString()  // "5:45:30 PM"
Intl.DateTimeFormat().resolvedOptions().timeZone  // "America/New_York"
```

---

## Error Handling & Edge Cases

### Missing/Null Values

**Producer**:
```python
coin_data.get("usd", 0)  # Default to 0 if missing
```

**Spark**:
```python
StructField("price", DoubleType(), False)  # Not nullable
# Will fail if null → logged and skipped
```

**Frontend**:
```javascript
const totalVolume = updates.reduce((sum, u) => sum + (u.volume_24h || 0), 0)
```

### Malformed JSON

**Spark**:
```python
try:
    parsed_df = raw_stream.select(from_json(...))
except Exception as e:
    print(f"Parse error: {e}")
    # Skip malformed message
```

### Division by Zero

**Frontend**:
```javascript
const avgChange = updates.length > 0 
  ? updates.reduce(...) / updates.length 
  : 0
```

---

## Performance Considerations

### Data Volume

| Metric | Value |
|--------|-------|
| **Records per batch** | 10 coins |
| **Batches per hour** | 120 |
| **Records per day** | 28,800 |
| **Storage (1 week)** | ~40 MB (Kafka retention) |

### Processing Latency

| Stage | Latency |
|-------|---------|
| **CoinGecko API** | ~200-500ms |
| **Kafka Produce** | <10ms |
| **Kafka → Spark** | <100ms |
| **Spark Processing** | ~1-2s (window close) |
| **Spark → FastAPI** | ~50-100ms |
| **WebSocket Broadcast** | <10ms |
| **Frontend Render** | ~16ms (60 FPS) |
| **Total (end-to-end)** | ~2-3 seconds |

### Bottlenecks

1. **CoinGecko API**: Rate limited to 30 calls/min (biggest bottleneck)
2. **Spark Windowing**: 30-second tumbling window adds delay
3. **WebSocket Broadcast**: O(n) per message (scales with client count)

---

## Message Examples

### Complete Flow Example

**1. CoinGecko API Response (Bitcoin only)**:
```json
{
  "bitcoin": {
    "usd": 103895,
    "usd_24h_change": 3.456789,
    "usd_24h_vol": 45678901234.56,
    "usd_market_cap": 2034567890123.45
  }
}
```

**2. Kafka Message**:
```json
{
  "coin": "bitcoin",
  "price": 103895.0,
  "change_24h": 3.456789,
  "volume_24h": 45678901234.56,
  "market_cap": 2034567890123.45,
  "timestamp": "2025-11-04T17:45:30Z"
}
```

**3. Spark Output (after aggregation)**:
```json
{
  "coin": "bitcoin",
  "coin_id": "BTC",
  "price": 103895.0,
  "change_24h": 3.45,
  "volume_24h": 45678901234.56,
  "volatility": "Moving",
  "trend": "📈 Rising",
  "timestamp": "2025-11-04T17:45:30Z"
}
```

**4. WebSocket Message (to frontend)**:
```json
{
  "type": "aqi_update",
  "data": [
    {
      "coin": "bitcoin",
      "coin_id": "BTC",
      "price": 103895.0,
      "change_24h": 3.45,
      "volume_24h": 45678901234.56,
      "volatility": "Moving",
      "trend": "📈 Rising",
      "timestamp": "2025-11-04T17:45:30Z"
    },
    ... // 9 more coins
  ]
}
```

**5. Frontend Display**:
- Chart: Bar at `$103.9K` labeled "BTC"
- Change badge: `+3.45%` (green)
- Volatility: "Moving"
- Trend: "📈 Rising"

---

**Last Updated**: November 4, 2025

