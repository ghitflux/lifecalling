from fastapi import APIRouter, WebSocket
from ..events import eventbus

ws_router = APIRouter()

@ws_router.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await eventbus.connect(ws)
    try:
        await ws.send_json({"event":"hello","payload":{"ok":True}})
        while True:
            # eco opcional
            await ws.receive_text()
    except Exception:
        pass
    finally:
        await eventbus.disconnect(ws)
