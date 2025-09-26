from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from ..db import SessionLocal
from ..models import Case, CaseEvent
from ..rbac import require_roles
from ..events import eventbus

r = APIRouter(prefix="/closing", tags=["closing"])

@r.get("/queue")
def queue(user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        rows = db.query(Case).filter(Case.status=="calculo_aprovado").order_by(Case.id.desc()).all()
        return {"items":[{"id":c.id,"client_id":c.client_id,"status":c.status} for c in rows]}

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
