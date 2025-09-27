from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import joinedload
from ..db import SessionLocal
from ..models import Case, CaseEvent, Client
from ..rbac import require_roles
from ..events import eventbus

r = APIRouter(prefix="/closing", tags=["closing"])

@r.get("/queue")
def queue(user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        # Query com JOIN para carregar dados completos
        rows = db.query(Case).options(
            joinedload(Case.client)
        ).filter(Case.status=="calculo_aprovado").order_by(Case.id.desc()).all()

        items = []
        for c in rows:
            try:
                # Estrutura compatível com CardFechamento
                item = {
                    "id": c.id,
                    "status": c.status,
                    "client": {
                        "name": c.client.name if c.client else "Cliente não encontrado",
                        "cpf": c.client.cpf if c.client else "",
                        "matricula": c.client.matricula if c.client else "",
                        "orgao": getattr(c.client, 'orgao', None) if c.client else None
                    },
                    "created_at": c.created_at.isoformat() if hasattr(c, 'created_at') and c.created_at else datetime.utcnow().isoformat(),
                    "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
                    "banco": getattr(c, 'banco', None),
                    # Adicionar dados de simulação/contrato se existirem
                    "simulation": None,  # TODO: adicionar se necessário
                    "contract": None     # TODO: adicionar se necessário
                }
                items.append(item)
            except Exception as e:
                # Log do erro mas continua processando outros casos
                print(f"Erro ao processar caso {c.id} para fechamento: {e}")
                # Adicionar item mínimo para não perder o caso
                items.append({
                    "id": c.id,
                    "status": c.status,
                    "client": {
                        "name": "Erro ao carregar dados",
                        "cpf": "",
                        "matricula": "",
                        "orgao": None
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "last_update_at": None,
                    "banco": None,
                    "simulation": None,
                    "contract": None
                })

        return {"items": items}

class CloseIn(BaseModel):
    case_id: int
    notes: str | None = None

@r.post("/approve")
async def approve(data: CloseIn, user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        c.status = "fechamento_aprovado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="closing.approved", payload={"notes": data.notes}, created_by=user.id))
        db.commit()
    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"fechamento_aprovado"})
    return {"ok": True}

@r.post("/reject")
async def reject(data: CloseIn, user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        c.status = "fechamento_reprovado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="closing.rejected", payload={"notes": data.notes}, created_by=user.id))
        db.commit()
    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"fechamento_reprovado"})
    return {"ok": True}
