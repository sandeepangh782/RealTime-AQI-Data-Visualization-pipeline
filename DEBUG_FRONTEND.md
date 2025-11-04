# Frontend Not Showing Data - Debug Checklist

## Step 1: Check Browser Console

Open **Chrome DevTools** (F12 or Cmd+Option+I) and look for:

### ✅ What You SHOULD See:
```
[ws] connecting ws://localhost:8000/ws
[ws] open
[ws] message aqi_update 10
[ui] 💱 received 10 crypto records
[ui] merged updates -> 10
```

### ❌ What Might Be Wrong:

**If you see:**
```
[ws] closed
[ws] error ...
```
**→ WebSocket can't connect**
- API server not running on port 8000
- Check: `curl http://localhost:8000/health`

**If you see nothing:**
```
(no logs at all)
```
**→ Frontend not running**
- Check: Is `npm run dev` running?
- Navigate to: http://localhost:5173

**If you see:**
```
[ws] open
(but no messages)
```
**→ No data being sent**
- Spark consumer not posting
- Check producer and consumer logs

---

## Step 2: Check API Server Logs

Look for:
```
[api] /ingest received: 10 records
[ws] broadcast type=aqi_update records=10 listeners=1
```

**If you see `listeners=0`:**
- Frontend's WebSocket didn't connect
- Restart frontend: `npm run dev`

**If you see nothing:**
- Consumer isn't posting
- Check Spark consumer logs

---

## Step 3: Check Spark Consumer Logs

Look for:
```
[consumer] 📦 micro-batch id=X rows=10
[consumer] 📤 posting 10 records -> http://localhost:8000/ingest
[consumer] ✓ ingest response status=200
```

**If you see:**
```
[consumer] 📦 micro-batch id=X rows=0
```
**→ No data from Kafka**
- Producer not sending data
- Check producer logs

**If you see:**
```
[consumer] ✗ ingest error: ...
```
**→ Can't reach API server**
- API server not running
- Wrong URL (should be http://localhost:8000/ingest)

---

## Step 4: Check Producer Logs

Look for:
```
✓ BTC    $103811.00 | Δ24h:  -3.73% | Vol:  28.50B
✓ ETH     $3120.00 | Δ24h:  -2.10% | Vol:  12.30B
─── Sent 10 records ───
```

**If you see:**
```
⚠️  API fetch error: 429 Client Error
```
**→ Rate limited**
- Wait 60 seconds and it will retry
- Already handled automatically

---

## Step 5: Check Data Format

In browser console, type:
```javascript
// This will show what data the frontend has
console.log(document.querySelector('.dashboard').__reactFiber$)
```

Or add this temporary debug line to Dashboard.jsx line 24:
```javascript
console.log('[DEBUG] Current updates:', updates)
```

**Expected data format:**
```javascript
[
  {
    coin: "BTC",
    coin_id: "bitcoin",
    price: 103811.00,
    change_24h: -3.73,
    volume_24h: 28500000000,
    volatility: "Moving",
    trend: "📉 Falling",
    timestamp: "2025-11-04T14:42:00Z"
  },
  // ... more coins
]
```

---

## Quick Fix Commands

### Restart Everything in Order:

```bash
# Terminal 1: API Server
cd backend/api_server
./start.sh

# Terminal 2: Producer
cd backend/kafka_producer
./start.sh

# Terminal 3: Consumer
cd backend/pyspark_consumer
./start_local.sh

# Terminal 4: Frontend
cd frontend
npm run dev
```

Wait 30 seconds for first data batch, then check http://localhost:5173

---

## Common Issues & Fixes

### Issue: "Tracking 0 Coins" shows in dashboard

**Cause:** No updates received yet
**Fix:** Wait 30 seconds for first batch

### Issue: Market stats show but chart is empty

**Cause:** D3 chart rendering issue
**Fix:** 
1. Check browser console for errors
2. Verify data has `coin` and `price` fields
3. Try refreshing the page (Cmd+R or Ctrl+R)

### Issue: Old AQI data showing instead of crypto

**Cause:** Browser cache
**Fix:** Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

### Issue: "All Coins" dropdown is empty

**Cause:** No data received
**Fix:** Check Steps 1-4 above

---

## Verify Data Flow

Run these commands to check each step:

### 1. Kafka has data
```bash
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic crypto_market_data \
  --from-beginning \
  --max-messages 5
```

You should see JSON crypto data.

### 2. API Server is healthy
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok"}
```

### 3. WebSocket endpoint exists
```bash
# In browser console:
new WebSocket('ws://localhost:8000/ws')
# Should show: WebSocket {url: "ws://localhost:8000/ws", ...}
```

---

## What to Send Me

If still not working, please share:

1. **Browser Console output** (copy all logs)
2. **API Server logs** (last 20 lines)
3. **Spark Consumer logs** (last 20 lines showing a batch)
4. **Screenshot of the dashboard**

This will help me identify exactly what's wrong!

