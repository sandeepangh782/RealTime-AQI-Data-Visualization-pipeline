# 🚀 Cryptocurrency Market Pulse Dashboard

## 📊 Overview

A real-time cryptocurrency market monitoring system that streams live data from CoinGecko API through a modern data pipeline. The system visualizes price trends, volatility, and market sentiment using Kafka, PySpark, FastAPI, and React with D3.js.

**Data Flow**: CoinGecko API → Kafka Producer → Kafka → Spark Consumer → FastAPI (WebSocket) → React (D3.js Charts)

![Dashboard Preview](https://github.com/user-attachments/assets/9f49d79c-3c10-4349-8aa2-d7b899373ef3)

---

## ✨ Features

- **Real-time Price Tracking**: Live updates every 30 seconds for 10 major cryptocurrencies
- **Dual Chart System**: 
  - Bar chart for comparing all cryptocurrencies
  - Line chart for individual coin trend analysis
- **Market Analytics**: 
  - Total 24h volume tracking
  - Average price change calculations
  - Market sentiment analysis (volatile/stable/rising/falling coins)
- **Smart Alerts**: Automatic notifications for extreme price movements
- **Professional UI**: Minimal design with Lucide React icons and responsive layout
- **Timezone Aware**: Displays updates in your local timezone

---

## 🏗️ Architecture

```
CoinGecko API (Public)
         ↓
  Kafka Producer (Python)
         ↓
  Kafka Topic: crypto_market_data
         ↓
  Spark Streaming Consumer (PySpark)
    - Aggregates data (30s windows)
    - Calculates volatility & trends
         ↓
  FastAPI Server (WebSocket)
         ↓
  React Frontend (Vite + D3.js)
    - Bar charts (all coins)
    - Line charts (individual coins)
    - Real-time updates via WebSocket
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (for Kafka, Zookeeper)
- **Python 3.10+** (for backend services)
- **Node.js 18+** (for React frontend)
- **Java 11+** (for Spark)
- **make** (optional, for convenience scripts)

### 1️⃣ Start Infrastructure (Kafka, Zookeeper)

```bash
cd backend
docker compose up -d
```

Wait 10-15 seconds for services to initialize.

### 2️⃣ Start Backend Services

Open **three separate terminal windows**:

**Terminal 1: Kafka Producer**
```bash
cd backend/kafka_producer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python producer.py
```

**Terminal 2: FastAPI Server**
```bash
cd backend/api_server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

**Terminal 3: PySpark Consumer**
```bash
cd backend/pyspark_consumer
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./start_local.sh
```

### 3️⃣ Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open your browser to **http://localhost:5173**

---

## 🌐 Services & Ports

| Service | Port/URL | Description |
|---------|----------|-------------|
| Kafka Broker | `localhost:9092` | Message broker |
| Zookeeper | `localhost:2181` | Kafka coordination |
| FastAPI Server | `http://localhost:8000` | REST API & WebSocket |
| WebSocket | `ws://localhost:8000/ws` | Real-time data stream |
| React Frontend | `http://localhost:5173` | Dashboard UI |

---

## 📁 Project Structure

```
bdv/
├── backend/
│   ├── docker-compose.yml          # Kafka & Zookeeper setup
│   ├── kafka_producer/
│   │   ├── producer.py             # Fetches CoinGecko API data
│   │   ├── config.json             # Kafka topic config
│   │   └── requirements.txt
│   ├── pyspark_consumer/
│   │   ├── spark_consumer.py       # Processes & aggregates data
│   │   ├── spark_config.json       # Spark & Kafka config
│   │   ├── start_local.sh          # Launch script
│   │   └── requirements.txt
│   └── api_server/
│       ├── app.py                  # FastAPI + WebSocket server
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Dashboard.jsx       # Main dashboard component
│   │   ├── components/
│   │   │   ├── AQIChart.jsx        # D3.js bar & line charts (renamed to CryptoChart)
│   │   │   ├── AQIAlert.jsx        # Alert notifications (renamed to CryptoAlert)
│   │   │   └── CitySelector.jsx    # Coin selector dropdown (renamed to CoinSelector)
│   │   ├── services/
│   │   │   └── socket.js           # WebSocket service
│   │   └── styles/
│   │       └── dashboard.css       # Dashboard styling
│   ├── package.json
│   └── vite.config.js
└── docs/
    ├── ARCHITECTURE.md             # System design & scalability
    ├── CHART_FEATURES.md           # Chart types & D3.js features
    ├── COMPONENTS.md               # React component documentation
    ├── DATA_FLOW.md                # Data format & transformations
    ├── PROCESS_FLOW_DIAGRAM.md     # Visual flow diagrams
    └── USER_GUIDE.md               # User interaction guide
```

---

## 📊 Tracked Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Solana (SOL)
- Ripple (XRP)
- Cardano (ADA)
- Dogecoin (DOGE)
- Polkadot (DOT)
- Avalanche (AVAX)
- Chainlink (LINK)

---

## 🛠️ Technology Stack

### Backend
- **Apache Kafka**: Message streaming platform
- **PySpark**: Distributed stream processing
- **FastAPI**: High-performance async API server
- **Python 3.10+**: Core backend language

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool & dev server
- **D3.js**: Data visualization library
- **Lucide React**: Icon library

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration

---

## 📚 Comprehensive Documentation

Explore detailed documentation to understand every aspect of the system:

### Core Documentation
- 📐 **[System Architecture](docs/ARCHITECTURE.md)** - Complete system design, technology choices, and scalability
- 📊 **[Chart Features & Visualization](docs/CHART_FEATURES.md)** - Bar vs line charts, D3.js implementation, color coding
- ⚛️ **[React Components Guide](docs/COMPONENTS.md)** - Component hierarchy, props, state management
- 🔄 **[Data Flow & Format](docs/DATA_FLOW.md)** - Message structure, transformations, and data types
- 🎨 **[Process Flow Diagrams](docs/PROCESS_FLOW_DIAGRAM.md)** - Visual flows from API to frontend
- 👤 **[User Guide & Interaction](docs/USER_GUIDE.md)** - How to use the dashboard, interactive features

### Additional Resources
- 🔧 **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and fixes
- 🎨 **[Design Guide](DESIGN_GUIDE.md)** - Complete design system and styling
- 📈 **[Chart Features](CHART_FEATURES.md)** - Dual-chart system explained
- 🌐 **[CoinGecko API Info](CRYPTO_API_INFO.md)** - API rate limits and alternatives

---

## 🔧 Configuration

### API Rate Limits
The free CoinGecko API has rate limits:
- **30 calls/minute**
- Producer configured for **30-second intervals** (2 calls/minute)

### Customization
- **Add more coins**: Edit `COINS` list in `backend/kafka_producer/producer.py`
- **Change update frequency**: Modify `time.sleep(30)` in producer (respect API limits!)
- **Adjust Spark window**: Change `window("30 seconds")` in `spark_consumer.py`

---

## 🐛 Troubleshooting

### Kafka won't connect
```bash
# Check if containers are running
docker ps

# Restart infrastructure
cd backend
docker compose down
docker compose up -d
```

### Producer gets rate-limited
```bash
# Error: HTTP 429 Too Many Requests
# Solution: Wait 60 seconds or increase sleep interval in producer.py
```

### Frontend shows no data
1. Check all three backend services are running
2. Open browser DevTools → Console for errors
3. Verify WebSocket connection: `ws://localhost:8000/ws`
4. Check FastAPI logs for incoming data

For more issues, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🌍 Environment Notes

- Each backend service uses its own Python virtual environment to avoid conflicts
- Kafka and Spark run in Docker containers for isolation
- On **Apple Silicon (M1/M2/M3)**, Docker will auto-pull ARM64-compatible images
- Adjust Docker Desktop memory if Spark jobs need more resources (Settings → Resources)

---

## 📄 License

This project is for educational purposes. CoinGecko API data is subject to their terms of service.

---

## 🤝 Contributing

Feel free to:
- Add more cryptocurrencies
- Implement new visualizations
- Enhance the UI/UX
- Optimize the data pipeline

---

## 📞 Support

For questions or issues:
1. Check the documentation in `docs/`
2. Review `TROUBLESHOOTING.md`
3. Verify all services are running correctly

---

**Happy Trading! 🚀📈💰**
