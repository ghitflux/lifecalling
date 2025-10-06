from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date
from sqlalchemy.orm import Session
from typing import List, Optional
from ..db import get_db
from ..models import Campaign
from ..rbac import require_roles

r = APIRouter(prefix="/campaigns", tags=["campaigns"])

# Schemas
class PremiacaoSchema(BaseModel):
    posicao: str
    premio: str

class CampaignCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    data_inicio: str  # ISO date string
    data_fim: str  # ISO date string
    status: str = "proxima"
    premiacoes: List[dict]
    meta_contratos: Optional[int] = None
    meta_consultoria: Optional[float] = None

class CampaignUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    status: Optional[str] = None
    premiacoes: Optional[List[dict]] = None
    meta_contratos: Optional[int] = None
    meta_consultoria: Optional[float] = None

@r.get("")
def list_campaigns(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """Listar todas as campanhas"""
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    return {
        "items": [
            {
                "id": c.id,
                "nome": c.nome,
                "descricao": c.descricao,
                "data_inicio": c.data_inicio.isoformat() if c.data_inicio else None,
                "data_fim": c.data_fim.isoformat() if c.data_fim else None,
                "status": c.status,
                "premiacoes": c.premiacoes or [],
                "meta_contratos": c.meta_contratos,
                "meta_consultoria": float(c.meta_consultoria) if c.meta_consultoria else None,
                "created_at": c.created_at.isoformat() if c.created_at else None
            }
            for c in campaigns
        ]
    }

@r.get("/active")
def get_active_campaigns(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """Listar campanhas ativas"""
    campaigns = db.query(Campaign).filter(Campaign.status == "ativa").all()
    return {
        "items": [
            {
                "id": c.id,
                "nome": c.nome,
                "descricao": c.descricao,
                "data_inicio": c.data_inicio.isoformat() if c.data_inicio else None,
                "data_fim": c.data_fim.isoformat() if c.data_fim else None,
                "status": c.status,
                "premiacoes": c.premiacoes or [],
                "meta_contratos": c.meta_contratos,
                "meta_consultoria": float(c.meta_consultoria) if c.meta_consultoria else None
            }
            for c in campaigns
        ]
    }

@r.get("/upcoming")
def get_upcoming_campaigns(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """Listar próximas campanhas"""
    campaigns = db.query(Campaign).filter(Campaign.status == "proxima").all()
    return {
        "items": [
            {
                "id": c.id,
                "nome": c.nome,
                "descricao": c.descricao,
                "data_inicio": c.data_inicio.isoformat() if c.data_inicio else None,
                "data_fim": c.data_fim.isoformat() if c.data_fim else None,
                "status": c.status,
                "premiacoes": c.premiacoes or []
            }
            for c in campaigns
        ]
    }

@r.get("/finished")
def get_finished_campaigns(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """Listar campanhas encerradas"""
    campaigns = db.query(Campaign).filter(Campaign.status == "encerrada").all()
    return {
        "items": [
            {
                "id": c.id,
                "nome": c.nome,
                "descricao": c.descricao,
                "data_inicio": c.data_inicio.isoformat() if c.data_inicio else None,
                "data_fim": c.data_fim.isoformat() if c.data_fim else None,
                "status": c.status,
                "premiacoes": c.premiacoes or []
            }
            for c in campaigns
        ]
    }

@r.get("/{campaign_id}")
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """Obter detalhes de uma campanha"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    return {
        "id": campaign.id,
        "nome": campaign.nome,
        "descricao": campaign.descricao,
        "data_inicio": campaign.data_inicio.isoformat() if campaign.data_inicio else None,
        "data_fim": campaign.data_fim.isoformat() if campaign.data_fim else None,
        "status": campaign.status,
        "premiacoes": campaign.premiacoes or [],
        "meta_contratos": campaign.meta_contratos,
        "meta_consultoria": float(campaign.meta_consultoria) if campaign.meta_consultoria else None,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None,
        "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None
    }

@r.post("")
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """Criar nova campanha (apenas admin)"""
    # Converter strings de data para datetime
    data_inicio = datetime.fromisoformat(payload.data_inicio.replace("Z", "+00:00"))
    data_fim = datetime.fromisoformat(payload.data_fim.replace("Z", "+00:00"))

    campaign = Campaign(
        nome=payload.nome,
        descricao=payload.descricao,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=payload.status,
        premiacoes=payload.premiacoes,
        meta_contratos=payload.meta_contratos,
        meta_consultoria=payload.meta_consultoria,
        created_by=user.id
    )

    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    return {
        "id": campaign.id,
        "nome": campaign.nome,
        "status": campaign.status,
        "created_at": campaign.created_at.isoformat() if campaign.created_at else None
    }

@r.put("/{campaign_id}")
def update_campaign(
    campaign_id: int,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """Atualizar campanha (apenas admin)"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    # Atualizar campos fornecidos
    if payload.nome is not None:
        campaign.nome = payload.nome
    if payload.descricao is not None:
        campaign.descricao = payload.descricao
    if payload.data_inicio is not None:
        campaign.data_inicio = datetime.fromisoformat(payload.data_inicio.replace("Z", "+00:00"))
    if payload.data_fim is not None:
        campaign.data_fim = datetime.fromisoformat(payload.data_fim.replace("Z", "+00:00"))
    if payload.status is not None:
        campaign.status = payload.status
    if payload.premiacoes is not None:
        campaign.premiacoes = payload.premiacoes
    if payload.meta_contratos is not None:
        campaign.meta_contratos = payload.meta_contratos
    if payload.meta_consultoria is not None:
        campaign.meta_consultoria = payload.meta_consultoria

    campaign.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(campaign)

    return {
        "id": campaign.id,
        "nome": campaign.nome,
        "status": campaign.status,
        "updated_at": campaign.updated_at.isoformat() if campaign.updated_at else None
    }

@r.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """Excluir campanha (apenas admin)"""
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campanha não encontrada")

    db.delete(campaign)
    db.commit()

    return {"message": "Campanha excluída com sucesso", "id": campaign_id}
