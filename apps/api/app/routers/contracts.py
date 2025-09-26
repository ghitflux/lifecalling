from fastapi import APIRouter, Depends
from ..db import SessionLocal
from ..models import Contract, Case
from ..rbac import require_roles

r = APIRouter(prefix="/contracts", tags=["contracts"])

@r.get("")
def list_contracts(limit:int=50, user=Depends(require_roles("admin","supervisor","financeiro"))):
    with SessionLocal() as db:
        q = db.query(Contract, Case).join(Case, Contract.case_id==Case.id).order_by(Contract.id.desc()).limit(limit)
        items=[]
        for ct, case in q.all():
            items.append({
                "id": ct.id,
                "case_id": case.id,
                "status": ct.status,
                "total_amount": float(ct.total_amount or 0),
                "installments": ct.installments,
                "paid_installments": ct.paid_installments,
                "disbursed_at": ct.disbursed_at.isoformat() if ct.disbursed_at else None,
                "case_status": case.status
            })
        return {"items": items}
