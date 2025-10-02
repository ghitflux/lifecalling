from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from pydantic import BaseModel
from ..db import SessionLocal
from ..models import Contract, Case, Client
from ..rbac import require_roles

r = APIRouter(prefix="/contracts", tags=["contracts"])

class PageOut(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int

@r.get("", response_model=PageOut)
def list_contracts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: str | None = None,
    status: str | None = None,
    order: str = Query("id_desc"),       # id_desc | id_asc | disbursed_desc
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    with SessionLocal() as db:
        qry = db.query(Contract).join(Case, Contract.case_id==Case.id).join(Client, Case.client_id==Client.id)

        if status:
            qry = qry.filter(Contract.status==status)
        if q:
            like = f"%{q}%"
            qry = qry.filter(or_(Client.name.ilike(like), Client.cpf.ilike(like)))

        total = qry.count()

        if order == "id_asc":
            qry = qry.order_by(Contract.id.asc())
        elif order == "disbursed_desc":
            qry = qry.order_by(Contract.disbursed_at.desc().nullslast(), Contract.id.desc())
        else:
            qry = qry.order_by(Contract.id.desc())

        rows = qry.offset((page-1)*page_size).limit(page_size).all()
        items = [{
            "id": ct.id,
            "case_id": ct.case_id,
            "status": ct.status,
            "total_amount": float(ct.total_amount or 0),
            "installments": ct.installments,
            "paid_installments": ct.paid_installments,
            "disbursed_at": ct.disbursed_at.isoformat() if ct.disbursed_at else None,
            "created_at": ct.created_at.isoformat() if ct.created_at else None,
            "updated_at": ct.updated_at.isoformat() if ct.updated_at else None,
            "case_status": ct.case.status,
            "client": {
                "id": ct.case.client.id,
                "name": ct.case.client.name,
                "cpf": ct.case.client.cpf,
                "matricula": ct.case.client.matricula
            }
        } for ct in rows]

        return {"items": items, "total": total, "page": page, "page_size": page_size}
