Live Air Quality & Pollution Dashboard

Overview
This project visualizes real-time AQI data using Kafka, PySpark, FastAPI, and a React+Vite frontend. Data flows: Producer → Kafka → Spark Consumer → FastAPI (WebSocket) → React (D3.js).

Quick Start
- Prereqs: Docker, Docker Compose, Python 3.10+, Node 18+, Java 11+ (for Spark), make (optional)
- Bring up infra (Kafka, Zookeeper, Spark):
  - cd backend
  - docker compose up -d
- Backend installs (in separate shells):
  - Kafka producer: cd backend/kafka_producer && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python producer.py
  - FastAPI server: cd backend/api_server && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app:app --reload
  - PySpark consumer: cd backend/pyspark_consumer && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && ./run_spark_local.sh
- Frontend:
  - cd frontend && npm install && npm run dev
  - open http://localhost:5173

Services & Ports
- Kafka broker: localhost:9092
- Zookeeper: localhost:2181
- FastAPI: http://localhost:8000 (WebSocket: ws://localhost:8000/ws)
- Vite dev server: http://localhost:5173

Topics
- air_quality_data (producer → consumer)

Environment
- Each backend service has its own Python venv under its folder to avoid global conflicts.
- Kafka/Spark run in Docker to isolate infra.

Notes
- If using Apple Silicon, Docker images will auto-pull arm64 where available.
- Adjust memory for Docker Desktop if Spark jobs need more resources.

