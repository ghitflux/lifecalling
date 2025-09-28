from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from ..events import eventbus
from ..security import get_current_user
import jwt
from ..config import settings
import json

ws_router = APIRouter()

async def authenticate_websocket(websocket: WebSocket, token: str = None):
    """Autentica usuário via token query parameter"""
    if not token:
        await websocket.close(code=1008, reason="Token required")
        return None

    try:
        # Decodifica e valida o token
        data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = int(data["sub"])

        # Busca usuário no banco
        from ..db import SessionLocal
        from ..models import User
        with SessionLocal() as db:
            user = db.get(User, user_id)
            if not user or not user.active:
                await websocket.close(code=1008, reason="Invalid user")
                return None
        return user
    except Exception as e:
        await websocket.close(code=1008, reason="Invalid token")
        return None

@ws_router.websocket("/ws")
async def ws_endpoint(ws: WebSocket, token: str = Query(None)):
    await ws.accept()

    # Autentica usuário
    user = await authenticate_websocket(ws, token)
    if not user:
        return

    await eventbus.connect(ws)
    try:
        await ws.send_json({
            "type": "hello",
            "data": {"ok": True, "user": user.name}
        })

        while True:
            try:
                message = await ws.receive_text()
                data = json.loads(message)

                # Responde ao ping com pong
                if data.get("type") == "ping":
                    await ws.send_json({"type": "pong"})

            except json.JSONDecodeError:
                await ws.send_json({
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await eventbus.disconnect(ws)
