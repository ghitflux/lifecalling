from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Notification, User
from ..events import eventbus
from datetime import datetime
from sqlalchemy import desc

r = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationCreate(BaseModel):
    user_id: int
    event: str
    payload: dict = {}

@r.get("")
def list_notifications(
    limit: int = 50,
    unread_only: bool = False,
    user=Depends(get_current_user)
):
    """Lista notificações do usuário atual"""
    with SessionLocal() as db:
        query = db.query(Notification).filter(Notification.user_id == user.id)

        if unread_only:
            query = query.filter(Notification.is_read == False)

        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()

        return {
            "items": [
                {
                    "id": n.id,
                    "event": n.event,
                    "payload": n.payload,
                    "is_read": n.is_read,
                    "created_at": n.created_at.isoformat() if n.created_at else None
                }
                for n in notifications
            ]
        }

@r.post("/{notification_id}/mark-read")
def mark_as_read(notification_id: int, user=Depends(get_current_user)):
    """Marca notificação como lida"""
    with SessionLocal() as db:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user.id
        ).first()

        if not notification:
            raise HTTPException(404, "Notification not found")

        notification.is_read = True
        db.commit()

        return {"ok": True}

@r.post("/mark-all-read")
def mark_all_as_read(user=Depends(get_current_user)):
    """Marca todas as notificações como lidas"""
    with SessionLocal() as db:
        db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()

        return {"ok": True}

@r.get("/unread-count")
def unread_count(user=Depends(get_current_user)):
    """Retorna contagem de notificações não lidas"""
    with SessionLocal() as db:
        count = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.is_read == False
        ).count()

        return {"count": count}

@r.post("")
async def create_notification(
    data: NotificationCreate,
    user=Depends(require_roles("admin", "supervisor"))
):
    """Cria nova notificação (admin apenas)"""
    with SessionLocal() as db:
        # Verificar se usuário existe
        target_user = db.get(User, data.user_id)
        if not target_user:
            raise HTTPException(404, "User not found")

        notification = Notification(
            user_id=data.user_id,
            event=data.event,
            payload=data.payload
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Enviar via WebSocket
        await eventbus.broadcast("notification.new", {
            "user_id": data.user_id,
            "notification": {
                "id": notification.id,
                "event": notification.event,
                "payload": notification.payload,
                "created_at": notification.created_at.isoformat()
            }
        })

        return {"id": notification.id}

# Função utilitária para criar notificações
async def create_notification_for_user(user_id: int, event: str, payload: dict = {}):
    """Função utilitária para criar notificações"""
    with SessionLocal() as db:
        notification = Notification(
            user_id=user_id,
            event=event,
            payload=payload
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Enviar via WebSocket
        await eventbus.broadcast("notification.new", {
            "user_id": user_id,
            "notification": {
                "id": notification.id,
                "event": notification.event,
                "payload": notification.payload,
                "created_at": notification.created_at.isoformat()
            }
        })

        return notification

async def notify_case_status_change(
    case_id: int,
    new_status: str,
    changed_by_user_id: int,
    notify_user_ids: list[int],
    additional_payload: dict = {}
):
    """
    Cria notificações para múltiplos usuários quando status de um caso muda.

    Args:
        case_id: ID do caso
        new_status: Novo status do caso
        changed_by_user_id: ID do usuário que mudou o status
        notify_user_ids: Lista de IDs de usuários para notificar
        additional_payload: Dados adicionais para incluir na notificação
    """
    from ..models import Case, User

    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            return

        changed_by_user = db.get(User, changed_by_user_id)
        changed_by_name = changed_by_user.name if changed_by_user else "Sistema"

        # Mensagens específicas por tipo de mudança de status
        status_messages = {
            "calculo_aprovado": f"✅ Simulação aprovada por {changed_by_name}",
            "calculo_rejeitado": f"❌ Simulação rejeitada por {changed_by_name}",
            "fechamento_aprovado": f"✅ Fechamento aprovado por {changed_by_name}",
            "fechamento_reprovado": f"❌ Fechamento reprovado por {changed_by_name}",
            "financeiro_pendente": f"💰 Caso enviado para financeiro por {changed_by_name}",
            "contrato_efetivado": f"📋 Contrato efetivado por {changed_by_name}",
        }

        message = status_messages.get(new_status, f"Status alterado para {new_status}")

        # Criar notificação para cada usuário
        for user_id in notify_user_ids:
            if user_id == changed_by_user_id:
                # Não notificar o usuário que fez a mudança
                continue

            payload = {
                "case_id": case_id,
                "message": message,
                "old_status": case.status,
                "new_status": new_status,
                "changed_by": changed_by_name,
                **additional_payload
            }

            notification = Notification(
                user_id=user_id,
                event="case.status_changed",
                payload=payload
            )
            db.add(notification)

        db.commit()

        # Broadcast via WebSocket para todos os usuários notificados
        await eventbus.broadcast("case.status_changed", {
            "case_id": case_id,
            "new_status": new_status,
            "changed_by": changed_by_name,
            "notified_users": [uid for uid in notify_user_ids if uid != changed_by_user_id]
        })