"""
Service para criação de eventos de casos.
Centraliza a lógica de registro de eventos no histórico.
"""
from sqlalchemy.orm import Session
from datetime import datetime
from ..models import CaseEvent, now_brt
from typing import Any, Dict


def create_case_event(
    db: Session,
    case_id: int,
    actor_id: int,
    event_type: str,
    payload: Dict[str, Any]
) -> CaseEvent:
    """
    Cria um evento de caso no histórico.

    Args:
        db: Sessão do banco de dados
        case_id: ID do caso
        actor_id: ID do usuário que executou a ação
        event_type: Tipo do evento (ex: 'comment.added', 'case.status_changed')
        payload: Dados adicionais do evento

    Returns:
        CaseEvent criado
    """
    event = CaseEvent(
        case_id=case_id,
        type=event_type,
        payload=payload,
        created_by=actor_id,
        created_at=now_brt()
    )
    db.add(event)
    db.flush()
    return event


def create_comment_events(
    db: Session,
    case_id: int,
    actor_id: int,
    channel: str,
    content: str
) -> None:
    """
    Cria eventos específicos para comentários.

    Cria um evento genérico 'comment.added' e um evento específico por canal:
    - ATENDIMENTO → case.observation
    - SIMULACAO → simulation.comment
    - FECHAMENTO → closing.notes
    - CLIENTE → client.comment

    Args:
        db: Sessão do banco de dados
        case_id: ID do caso
        actor_id: ID do usuário que executou a ação
        channel: Canal do comentário
        content: Conteúdo do comentário (preview para o evento)
    """
    # Evento genérico
    create_case_event(
        db=db,
        case_id=case_id,
        actor_id=actor_id,
        event_type="comment.added",
        payload={
            "channel": channel,
            "notes": content[:200]  # Preview do conteúdo
        }
    )

    # Evento específico por canal (alias)
    channel_event_map = {
        "ATENDIMENTO": "case.observation",
        "SIMULACAO": "simulation.comment",
        "FECHAMENTO": "closing.notes",
        "CLIENTE": "client.comment"
    }

    specific_event_type = channel_event_map.get(channel)
    if specific_event_type:
        create_case_event(
            db=db,
            case_id=case_id,
            actor_id=actor_id,
            event_type=specific_event_type,
            payload={
                "notes": content[:200]
            }
        )
