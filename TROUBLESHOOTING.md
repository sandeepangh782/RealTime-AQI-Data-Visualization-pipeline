# Troubleshooting Guide

## Issue: API Server Timeout Errors ✅ FIXED

### Problem
```
[consumer] ✗ ingest error: HTTPConnectionPool(host='localhost', port=8000): Read timed out. (read timeout=10)
```

### Root Cause
The `/ingest` endpoint was **waiting for WebSocket broadcast to complete** before returning the response. When WebSocket clients were slow or disconnected, this caused:
1. Long response times (>10 seconds)
2. Timeout errors in Spark consumer
3. Data not reaching the frontend

### Solution Applied

**1. Fire-and-Forget Broadcast** 🔥
```python
# Before: Blocking
await manager.broadcast_json({"type": "aqi_update", "data": payload.data})

# After: Non-blocking
asyncio.create_task(manager.broadcast_json({"type": "aqi_update", "data": payload.data}))
```

**2. WebSocket Client Timeout** ⏱️
- Added 2-second timeout per WebSocket client
- Automatically drops slow/dead connections
- Prevents one slow client from blocking all broadcasts

**3. Increased Consumer Timeout** 📡
- Changed Spark consumer timeout: 10s → 30s
- Provides more buffer for network delays

### Files Changed
- ✅ `backend/api_server/app.py` - Non-blocking broadcast
- ✅ `backend/pyspark_consumer/spark_consumer.py` - Increased timeout

### Expected Behavior Now

**API Server:**
```
[api] /ingest received: 10 records
[ws] broadcast type=aqi_update records=10 listeners=1
```

**Spark Consumer:**
```
[consumer] 📤 posting 10 records -> http://localhost:8000/ingest
[consumer] ✓ ingest response status=200
```

**Frontend:**
- Data updates every 30 seconds
- No delays or timeouts
- Smooth real-time updates

---

## Other Common Issues

### 1. CoinGecko Rate Limiting

**Symptom:**
```
⚠️  API fetch error: 429 Client Error: Too Many Requests
```

**Solution:**
- Already handled with 30s interval (2 calls/min)
- Automatic retry with exponential backoff
- If persistent, wait 60s before restarting producer

### 2. Kafka Connection Issues

**Symptom:**
```
Attempt 1/5 failed: NoBrokersAvailable
```

**Solution:**
```bash
# Check if Kafka is running
docker ps | grep kafka

# If not, start infrastructure
cd backend
docker-compose up -d

# Wait 10 seconds for Kafka to be ready
sleep 10
```

### 3. Spark Not Finding Kafka Jars

**Symptom:**
```
Error: Cannot find kafka-clients jar
```

**Solution:**
- First run downloads jars automatically
- Wait for ivy resolution to complete (~30 seconds)
- Jars cached in `~/.ivy2/jars/`

### 4. Frontend Not Receiving Updates

**Symptom:**
Dashboard shows no data or stale data

**Checklist:**
1. ✅ API server running on port 8000?
   ```bash
   curl http://localhost:8000/health
   ```

2. ✅ WebSocket connected?
   - Check browser console for `[ui] 💱 received X crypto records`

3. ✅ Producer sending data?
   - Check producer logs for `✓ BTC ...`

4. ✅ Consumer processing?
   - Check consumer logs for `📤 posting X records`

**Fix:**
```bash
# Restart all services in order
cd backend/api_server && ./start.sh
cd backend/kafka_producer && ./start.sh
cd backend/pyspark_consumer && ./start_local.sh
cd frontend && npm run dev
```

---

## Performance Tuning

### If Updates Are Too Slow

**Current: 30 seconds**
```python
# In producer.py
time.sleep(30)

# In spark_consumer.py
.groupBy(F.window("event_time", "30 seconds"), ...)
.trigger(processingTime="30 seconds")
```

**To Speed Up (Requires paid API):**
```python
# For 10-second updates
time.sleep(10)
F.window("event_time", "10 seconds")
.trigger(processingTime="10 seconds")
```

### If Memory Usage Is High

**Reduce Spark Partitions:**
```python
# In spark_consumer.py create_spark()
.config("spark.sql.shuffle.partitions", "2")  # Default: 4
```

### If Broadcast Is Slow

**Limit WebSocket Connections:**
```python
# In app.py ConnectionManager
MAX_CONNECTIONS = 10

async def connect(self, websocket: WebSocket) -> None:
    if len(self._connections) >= MAX_CONNECTIONS:
        await websocket.close(code=1008, reason="Too many connections")
        return
    # ... rest of connect logic
```

---

## Restart Everything (Clean Slate)

```bash
# 1. Stop all services
# Ctrl+C in all terminal windows

# 2. Stop Docker
cd backend
docker-compose down

# 3. Clean Spark checkpoints (optional)
rm -rf /tmp/temporary-*

# 4. Start fresh
docker-compose up -d
sleep 10

# 5. Start API server
cd api_server
./start.sh

# In new terminal
cd backend/kafka_producer
./start.sh

# In new terminal
cd backend/pyspark_consumer
./start_local.sh

# In new terminal
cd frontend
npm run dev
```

---

## Logs Location

- **Kafka/Zookeeper**: `docker-compose logs -f`
- **API Server**: stdout in terminal
- **Producer**: stdout in terminal
- **Spark Consumer**: stdout in terminal
- **Frontend**: Browser console + terminal

---

## Health Checks

```bash
# API Server
curl http://localhost:8000/health
# Should return: {"status":"ok"}

# Kafka Topics
docker exec -it kafka kafka-topics.sh --list --bootstrap-server localhost:9092
# Should show: crypto_market_data

# WebSocket
# Open browser to http://localhost:5173
# Check console for: [ui] 💱 received X crypto records
```

