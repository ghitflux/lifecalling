from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime
from uuid import UUID

# Tipo literal para canais de comentários
Channel = Literal["ATENDIMENTO", "SIMULACAO", "FECHAMENTO", "CLIENTE"]


class CommentCreate(BaseModel):
    """Schema para criação de comentário"""
    case_id: int
    channel: Channel
    content: str
    parent_id: Optional[UUID] = None


class CommentOut(BaseModel):
    """Schema para retorno de comentário"""
    id: UUID
    case_id: int
    author_id: Optional[int]
    author_name: str
    role: str
    channel: str
    content: str
    parent_id: Optional[UUID]
    created_at: datetime
    edited_at: Optional[datetime]
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True
