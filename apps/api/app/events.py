from typing import Set
from fastapi import WebSocket
import asyncio
import json
from datetime import datetime, timedelta

class EventBus:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()
        self.last_broadcast: dict[str, datetime] = {}
        self.debounce_ms = 100  # 100ms debounce

    async def connect(self, ws: WebSocket):
        async with self.lock:
            self.clients.add(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self, event: str, payload: dict):
        """
        Broadcast otimizado com debounce para evitar múltiplos broadcasts desnecessários.
        Se o mesmo evento foi enviado há menos de 100ms, ignora.
        """
        # Criar chave única para o evento
        event_key = f"{event}:{json.dumps(payload, sort_keys=True)}"
        now = datetime.utcnow()

        # Verificar se precisa debounce
        if event_key in self.last_broadcast:
            time_since_last = (now - self.last_broadcast[event_key]).total_seconds() * 1000
            if time_since_last < self.debounce_ms:
                return  # Ignora broadcast duplicado

        # Atualizar timestamp
        self.last_broadcast[event_key] = now

        # Limpar timestamps antigos (> 5 segundos)
        cutoff = now - timedelta(seconds=5)
        self.last_broadcast = {k: v for k, v in self.last_broadcast.items() if v > cutoff}

        # Broadcast sem lock de leitura (apenas lock de escrita)
        data = json.dumps({"event": event, "payload": payload})
        clients_copy = self.clients.copy()

        dead = []
        for ws in clients_copy:
            try:
                await ws.send_text(data)
            except Exception as e:
                print(f"[EventBus] Erro ao enviar para cliente: {e}")
                dead.append(ws)

        # Remover clientes mortos (com lock)
        if dead:
            async with self.lock:
                for ws in dead:
                    self.clients.discard(ws)

eventbus = EventBus()
