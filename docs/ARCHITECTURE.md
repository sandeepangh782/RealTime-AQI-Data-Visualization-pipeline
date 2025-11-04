# 🏗️ System Architecture

## Overview

The Cryptocurrency Market Pulse Dashboard is a **real-time streaming data pipeline** that fetches, processes, and visualizes cryptocurrency market data. The system follows a modern, scalable architecture pattern using Apache Kafka for message streaming and PySpark for distributed processing.

---

## High-Level Architecture

```
┌─────────────────┐
│  CoinGecko API  │ (Public API - Free Tier)
└────────┬────────┘
         │ HTTP GET /simple/price
         │ Every 30 seconds
         ↓
┌─────────────────────────────────────────────────────────┐
│                    KAFKA PRODUCER                        │
│  - Fetches live crypto data                             │
│  - Handles rate limiting (429 errors)                   │
│  - Exponential backoff retry logic                      │
│  - Transforms to JSON format                            │
│  - Publishes to Kafka topic                             │
└────────┬────────────────────────────────────────────────┘
         │ Produces to topic: crypto_market_data
         ↓
┌─────────────────────────────────────────────────────────┐
│              APACHE KAFKA (Docker)                       │
│  - Message broker & queue                               │
│  - Ensures at-least-once delivery                       │
│  - Decouples producer from consumer                     │
│  - Topic: crypto_market_data                            │
└────────┬────────────────────────────────────────────────┘
         │ Consumer reads from topic
         ↓
┌─────────────────────────────────────────────────────────┐
│             PYSPARK CONSUMER                             │
│  - Structured streaming from Kafka                      │
│  - 30-second tumbling windows                           │
│  - Aggregates: avg price, avg change, max volume        │
│  - Calculates: volatility status, trend direction       │
│  - Groups by coin                                       │
│  - Sends batch to API server                            │
└────────┬────────────────────────────────────────────────┘
         │ HTTP POST /ingest (batched records)
         ↓
┌─────────────────────────────────────────────────────────┐
│              FASTAPI SERVER                              │
│  - REST API endpoint (/ingest)                          │
│  - WebSocket manager                                    │
│  - Broadcasts to connected clients                      │
│  - Non-blocking async architecture                      │
│  - Client timeout handling (2s)                         │
└────────┬────────────────────────────────────────────────┘
         │ WebSocket: ws://localhost:8000/ws
         │ JSON messages with type: "aqi_update"
         ↓
┌─────────────────────────────────────────────────────────┐
│              REACT FRONTEND                              │
│  - WebSocket client connection                          │
│  - Real-time state updates                              │
│  - Price history tracking (last 20 points)              │
│  - D3.js visualizations (bar & line charts)             │
│  - Responsive UI with Lucide icons                      │
└─────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Kafka Producer (`backend/kafka_producer/producer.py`)

**Purpose**: Fetch live cryptocurrency data from CoinGecko API and publish to Kafka.

**Key Features**:
- **API Integration**: Uses CoinGecko's `/simple/price` endpoint
- **Rate Limit Handling**: 
  - Respects `Retry-After` headers
  - Exponential backoff (5s, 10s, 20s)
  - Max 3 retry attempts
- **Data Format**: Publishes JSON with:
  - `coin`: Cryptocurrency ID
  - `price`: Current USD price
  - `change_24h`: 24-hour percentage change
  - `volume_24h`: 24-hour trading volume
  - `market_cap`: Market capitalization
  - `timestamp`: ISO 8601 timestamp (UTC)

**Configuration** (`config.json`):
```json
{
  "kafka_broker": "localhost:9092",
  "topic": "crypto_market_data"
}
```

**Update Frequency**: 30 seconds (to stay within API limits)

---

### 2. Apache Kafka (Docker Container)

**Purpose**: Message broker for decoupling data producers and consumers.

**Configuration** (`docker-compose.yml`):
- **Kafka Broker**: Port 9092 (host) → 29092 (container)
- **Zookeeper**: Port 2181
- **Topic**: `crypto_market_data`
- **Partitions**: 1 (single partition for simplicity)
- **Replication**: 1 (single broker)

**Benefits**:
- **Fault Tolerance**: Messages persist even if consumer crashes
- **Scalability**: Can add more consumers to process data in parallel
- **Decoupling**: Producer and consumer operate independently

---

### 3. PySpark Consumer (`backend/pyspark_consumer/spark_consumer.py`)

**Purpose**: Process streaming data from Kafka, aggregate, and forward to API server.

**Processing Pipeline**:

1. **Read Stream**: Connect to Kafka topic `crypto_market_data`
2. **Parse JSON**: Extract fields (coin, price, change, volume, market_cap, timestamp)
3. **Windowing**: Group data into 30-second tumbling windows
4. **Aggregation**: Calculate per coin:
   - Average price
   - Average 24h change
   - Maximum 24h volume
   - Latest market cap
5. **Enrichment**: Add computed fields:
   - **Volatility Status**: 
     - `Stable` (±0-2%)
     - `Moving` (±2-5%)
     - `Volatile` (±5-10%)
     - `High Volatility` (±10-20%)
     - `Extreme` (±20%+)
   - **Trend Direction**:
     - `🚀 Surging` (+5%+)
     - `📈 Rising` (+2% to +5%)
     - `➡️ Stable` (-2% to +2%)
     - `📉 Falling` (-5% to -2%)
     - `💥 Crashing` (-5% or worse)
6. **Send to API**: HTTP POST to `http://localhost:8000/ingest`

**Configuration** (`spark_config.json`):
```json
{
  "app_name": "Crypto-Market-Consumer",
  "kafka_broker": "localhost:9092",
  "topic": "crypto_market_data"
}
```

**Window Duration**: 30 seconds (matches producer frequency)

---

### 4. FastAPI Server (`backend/api_server/app.py`)

**Purpose**: Receive aggregated data from Spark and broadcast to frontend via WebSocket.

**Endpoints**:

- **POST /ingest**: Receive batch of crypto records from Spark
  - Accepts JSON payload: `{ "data": [...] }`
  - Broadcasts to all WebSocket clients (non-blocking)
  - Returns count of records received

- **WebSocket /ws**: Real-time data stream
  - Clients connect and receive updates
  - Message format: `{ "type": "aqi_update", "data": [...] }`
  - Automatic client cleanup on disconnect
  - 2-second timeout per client to prevent blocking

**Key Features**:
- **Async Architecture**: Uses `asyncio.create_task` for non-blocking broadcasts
- **Client Management**: Tracks active connections, drops dead/slow clients
- **CORS Enabled**: Allows frontend on different port (5173) to connect

**Performance**:
- Handles 10+ concurrent WebSocket connections
- Non-blocking ingestion (responds in <10ms)
- Graceful degradation if clients are slow

---

### 5. React Frontend (`frontend/src/`)

**Purpose**: Visualize real-time cryptocurrency data with interactive charts.

**Main Components**:

1. **Dashboard.jsx** (Main Page)
   - WebSocket connection management
   - State management (updates, coins, selected coin, price history)
   - Market statistics calculation
   - Layout and component orchestration

2. **CryptoChart.jsx** (Visualization)
   - **Bar Chart**: All coins comparison (linear scale with K formatting)
   - **Line Chart**: Single coin trend (time series with gradient fill)
   - D3.js rendering with scales, axes, tooltips
   - Interactive hover effects

3. **CryptoAlert.jsx** (Alerts)
   - Displays extreme price movements
   - Color-coded: green (rising), red (falling)
   - Sorted by absolute change

4. **CoinSelector.jsx** (Selector)
   - Dropdown for choosing cryptocurrency
   - "All Cryptocurrencies" option

**State Management**:
- `updates`: Latest data from WebSocket (array of crypto objects)
- `selectedCoin`: Currently selected coin (default: "ALL")
- `priceHistory`: Historical price data (last 20 points per coin)

**Update Flow**:
```
WebSocket Message → Parse JSON → Update State → React Re-render → D3.js Redraw
```

---

## Data Flow Diagram

```
Time: 0s
┌─────────┐
│ Producer│─── Fetch CoinGecko API ───┐
└─────────┘                            │
                                       ↓
                               ┌──────────────┐
                               │ JSON Response│
                               │ (10 coins)   │
                               └──────┬───────┘
                                      │
                                      ↓
                               ┌──────────────┐
                               │    Kafka     │
                               │   (store)    │
                               └──────────────┘

Time: 0-30s
                               ┌──────────────┐
                               │    Kafka     │
                               │  (buffering) │
                               └──────┬───────┘
                                      │
                                      ↓
                               ┌──────────────┐
                               │    Spark     │
                               │ (windowing)  │
                               └──────────────┘

Time: 30s (Window Complete)
                               ┌──────────────┐
                               │    Spark     │
                               │ (aggregate)  │
                               └──────┬───────┘
                                      │
                                      ↓
                               ┌──────────────┐
                               │   FastAPI    │
                               │  (broadcast) │
                               └──────┬───────┘
                                      │
                                      ↓
                               ┌──────────────┐
                               │    React     │
                               │  (render)    │
                               └──────────────┘
```

---

## Scalability Considerations

### Current Design (Single Machine)
- **Kafka**: Single broker, single partition
- **Spark**: Local mode (all cores on one machine)
- **FastAPI**: Single instance
- **Frontend**: Static files served by Vite dev server

### Production Scaling Options

**Horizontal Scaling**:
1. **Kafka**: Add more brokers, increase partitions for parallel processing
2. **Spark**: Deploy to cluster (Standalone, YARN, or Kubernetes)
3. **FastAPI**: Load balance multiple instances behind nginx/ALB
4. **Frontend**: Serve from CDN, implement client-side caching

**Vertical Scaling**:
1. Increase Kafka broker memory for larger message buffers
2. Add more CPU cores for Spark executors
3. Increase FastAPI worker count (Gunicorn with Uvicorn workers)

**Performance Bottlenecks** (current):
- CoinGecko API rate limits (30 calls/min on free tier)
- Single Kafka partition limits parallelism
- WebSocket broadcast is O(n) per message (n = number of clients)

---

## Fault Tolerance

### Producer Failures
- **Retry Logic**: 3 attempts with exponential backoff
- **API Rate Limiting**: Respects `Retry-After` headers
- **Graceful Degradation**: Logs errors, continues on next cycle

### Consumer Failures
- **Kafka Offset Management**: Spark tracks committed offsets
- **Checkpointing**: Can resume from last processed batch
- **Error Handling**: Logs malformed messages, continues processing

### Network Failures
- **Kafka Persistence**: Messages stored until consumed
- **WebSocket Reconnection**: Frontend can reconnect (manual refresh)
- **API Server Timeout**: Drops slow clients (2s timeout)

---

## Security Considerations

**Current State** (Development):
- No authentication
- HTTP (not HTTPS)
- Local network only

**Production Recommendations**:
1. **Authentication**: JWT tokens for WebSocket connections
2. **HTTPS**: TLS/SSL certificates for all services
3. **API Keys**: Secure CoinGecko API key in environment variables
4. **CORS**: Restrict to specific frontend domain
5. **Rate Limiting**: Implement per-client rate limits
6. **Firewall**: Restrict Kafka/Zookeeper ports to internal network

---

## Monitoring & Observability

**Current Logging**:
- Producer: API call status, rate limit warnings
- Spark: Batch processing time, row counts, sample data
- FastAPI: Ingest counts, WebSocket connections
- Frontend: Console logs for WebSocket messages

**Production Recommendations**:
1. **Metrics**: Prometheus + Grafana
   - Kafka lag, throughput
   - Spark batch duration
   - API server response times
   - WebSocket connection count
2. **Tracing**: Jaeger or Zipkin for distributed tracing
3. **Alerting**: PagerDuty/Opsgenie for critical failures
4. **Dashboards**: Real-time health monitoring

---

## Technology Choices & Rationale

| Technology | Why Chosen | Alternatives |
|------------|------------|--------------|
| **Kafka** | Industry-standard streaming, fault-tolerant | RabbitMQ, Redis Streams, AWS Kinesis |
| **PySpark** | Distributed processing, mature ecosystem | Apache Flink, Apache Storm, Kafka Streams |
| **FastAPI** | High performance, async support, WebSockets | Flask-SocketIO, Django Channels, Node.js |
| **React** | Component-based, large ecosystem | Vue.js, Svelte, Angular |
| **D3.js** | Powerful, customizable visualizations | Chart.js, Recharts, Plotly |
| **Docker** | Easy local development, reproducible | Kubernetes (overkill for local) |

---

## Future Enhancements

1. **Historical Data Storage**: Add PostgreSQL/TimescaleDB for long-term storage
2. **More Data Sources**: Integrate Binance, Coinbase APIs for redundancy
3. **Advanced Analytics**: Predictive models (ARIMA, LSTM) for price forecasting
4. **User Accounts**: Personalized watchlists and alerts
5. **Mobile App**: React Native version for iOS/Android
6. **Push Notifications**: Browser notifications for extreme price changes

---

**Last Updated**: November 4, 2025

