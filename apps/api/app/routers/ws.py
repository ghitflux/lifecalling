from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..events import eventbus
# (unused import removed)
import jwt
from ..config import settings
import json

ws_router = APIRouter()

async def authenticate_websocket(websocket: WebSocket):
    """Autentica usuário via cookie access no header"""
    try:
        # Extrai cookies do header
        cookie_header = websocket.headers.get("cookie", "")
        cookies = {}

        if cookie_header:
            for cookie in cookie_header.split(";"):
                if "=" in cookie:
                    key, value = cookie.strip().split("=", 1)
                    cookies[key] = value

        # Busca token access no cookie
        token = cookies.get("access")
        if not token:
            await websocket.close(code=1008, reason="Access token required")
            return None

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
    except Exception:
        await websocket.close(code=1008, reason="Invalid token")
        return None

@ws_router.websocket("/ws/events")
async def ws_events(ws: WebSocket):
    # Autentica usuário antes de aceitar conexão
    user = await authenticate_websocket(ws)
    if not user:
        return

    await ws.accept()

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
