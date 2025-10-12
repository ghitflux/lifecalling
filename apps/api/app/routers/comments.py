"""
Router para sistema unificado de comentários.
Substitui observações dispersas com canais específicos.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy import and_
from datetime import datetime

from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Comment, Case, User
from ..schemas.comments import CommentCreate, CommentOut, Channel
from ..services.events import create_comment_events
from ..events import eventbus

r = APIRouter(prefix="/comments", tags=["comments"])


@r.post("", response_model=CommentOut)
async def create_comment(
    data: CommentCreate,
    user=Depends(require_roles(
        "admin", "supervisor", "calculista", "atendente", "financeiro", "fechamento"
    ))
):
    """
    Cria um novo comentário em um caso.

    Registra:
    - Comentário na tabela `comments`
    - Evento genérico `comment.added`
    - Evento específico por canal (case.observation, simulation.comment, etc.)
    """
    with SessionLocal() as db:
        # Verificar se o caso existe
        case = db.get(Case, data.case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Criar comentário
        comment = Comment(
            case_id=data.case_id,
            author_id=user.id,
            author_name=user.name,
            role=user.role,
            channel=data.channel,
            content=data.content,
            parent_id=data.parent_id,
            created_at=datetime.utcnow()
        )
        db.add(comment)
        db.flush()

        # Criar eventos no histórico do caso
        create_comment_events(
            db=db,
            case_id=data.case_id,
            actor_id=user.id,
            channel=data.channel,
            content=data.content
        )

        db.commit()
        db.refresh(comment)

    # Broadcast via WebSocket
    await eventbus.broadcast(
        "comment.added",
        {
            "case_id": data.case_id,
            "channel": data.channel,
            "author": user.name
        }
    )

    return comment


@r.get("/case/{case_id}", response_model=List[CommentOut])
def get_case_comments(
    case_id: int,
    channel: Optional[Channel] = Query(None, description="Filtrar por canal"),
    user=Depends(require_roles(
        "admin", "supervisor", "calculista", "atendente", "financeiro", "fechamento"
    ))
):
    """
    Lista comentários de um caso.

    Query params:
    - channel: Filtrar por canal específico (ATENDIMENTO, SIMULACAO, FECHAMENTO, CLIENTE)

    Retorna comentários em ordem cronológica (created_at crescente).
    Não retorna comentários deletados (deleted_at != NULL).
    """
    with SessionLocal() as db:
        # Verificar se o caso existe
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Query base
        query = db.query(Comment).filter(
            and_(
                Comment.case_id == case_id,
                Comment.deleted_at.is_(None)  # Não retornar deletados
            )
        )

        # Filtrar por canal se especificado
        if channel:
            query = query.filter(Comment.channel == channel)

        # Ordenar por data de criação (mais antigo primeiro)
        comments = query.order_by(Comment.created_at.asc()).all()

        return comments
