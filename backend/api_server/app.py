import asyncio
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


class IngestPayload(BaseModel):
    data: List[Dict]


app = FastAPI(title="AQI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.append(websocket)
        print(f"[ws] client connected. total={len(self._connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._connections:
            self._connections.remove(websocket)
        print(f"[ws] client disconnected. total={len(self._connections)}")

    async def broadcast_json(self, message: Dict) -> None:
        living: List[WebSocket] = []
        for ws in self._connections:
            try:
                # Add timeout to prevent slow clients from blocking
                await asyncio.wait_for(ws.send_json(message), timeout=2.0)
                living.append(ws)
            except asyncio.TimeoutError:
                print(f"[ws] client timeout - dropping connection")
                # drop slow/dead socket
                pass
            except Exception as e:
                print(f"[ws] client error: {e} - dropping connection")
                # drop dead socket
                pass
        self._connections = living
        # log payload sizes without dumping data
        size = 0
        if isinstance(message, dict) and isinstance(message.get("data"), list):
            size = len(message.get("data"))
        print(f"[ws] broadcast type={message.get('type')} records={size} listeners={len(self._connections)}")


manager = ConnectionManager()


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(payload: IngestPayload) -> Dict[str, int]:
    print(f"[api] /ingest received: {len(payload.data)} records")
    # Broadcast in background (fire-and-forget) to avoid blocking the response
    asyncio.create_task(manager.broadcast_json({"type": "aqi_update", "data": payload.data}))
    return {"count": len(payload.data)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; we don't expect client messages
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


