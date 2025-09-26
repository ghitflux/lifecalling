from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from ..db import SessionLocal
from ..models import Case, CaseEvent, Contract
from ..rbac import require_roles
from ..events import eventbus

r = APIRouter(prefix="/finance", tags=["finance"])

@r.get("/queue")
def queue(user=Depends(require_roles("admin","supervisor","financeiro"))):
    with SessionLocal() as db:
        rows = db.query(Case).filter(Case.status=="fechamento_aprovado").order_by(Case.id.desc()).all()
        return {"items":[{"id":c.id,"client_id":c.client_id,"status":c.status} for c in rows]}

class DisburseIn(BaseModel):
    case_id: int
    total_amount: float
    installments: int
    disbursed_at: datetime | None = None

@r.post("/disburse")
async def disburse(data: DisburseIn, user=Depends(require_roles("admin","supervisor","financeiro"))):
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")

        ct = db.query(Contract).filter(Contract.case_id==c.id).first()
        if not ct:
            ct = Contract(case_id=c.id)
        ct.total_amount = data.total_amount
        ct.installments = data.installments
        ct.disbursed_at = data.disbursed_at or datetime.utcnow()
        ct.updated_at = datetime.utcnow()
        db.add(ct)

        c.status = "contrato_efetivado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="finance.disbursed",
                         payload={"contract_id": None, "amount": data.total_amount, "installments": data.installments},
                         created_by=user.id))
        db.commit()
        db.refresh(ct)

    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"contrato_efetivado"})
    return {"contract_id": ct.id}
