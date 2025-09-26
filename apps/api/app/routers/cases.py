from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Case, Client, CaseEvent
from datetime import datetime
from ..config import settings
import os
import shutil

r = APIRouter(prefix="/cases", tags=["cases"])

class CasePatch(BaseModel):
    telefone_preferencial: str | None = None
    observacoes: str | None = None

@r.get("/{case_id}")
def get_case(case_id:int, user=Depends(get_current_user)):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        return {"id": c.id, "status": c.status, "client": {
          "id": c.client.id, "name": c.client.name, "cpf": c.client.cpf,
          "matricula": c.client.matricula, "orgao": c.client.orgao,
          "telefone_preferencial": c.client.telefone_preferencial
        }}

@r.post("/{case_id}/assign")
def assign_case(case_id:int, user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        c.assigned_user_id = user.id
        c.status = "em_atendimento"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="case.assigned", payload={"to":user.id}, created_by=user.id))
        db.commit()
        return {"ok": True}

@r.patch("/{case_id}")
def patch_case(case_id:int, data: CasePatch, user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        if data.telefone_preferencial is not None:
            c.client.telefone_preferencial = data.telefone_preferencial
        if data.observacoes is not None:
            c.client.observacoes = data.observacoes
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="case.updated", payload=data.model_dump(), created_by=user.id))
        db.commit()
        return {"ok": True}

@r.post("/{case_id}/attachments")
def upload_attachment(case_id:int, file: UploadFile = File(...), user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente"))):
    os.makedirs(settings.upload_dir, exist_ok=True)
    dest = os.path.join(settings.upload_dir, f"case_{case_id}_{file.filename}")
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    # (Persistir Attachment + CaseEvent)
    from ..models import Attachment
    from ..db import SessionLocal
    with SessionLocal() as db:
        a = Attachment(case_id=case_id, path=dest, mime=file.content_type, size=os.path.getsize(dest), uploaded_by=user.id)
        db.add(a)
        db.add(CaseEvent(case_id=case_id, type="attachment.added", payload={"path":dest,"name":file.filename}, created_by=user.id))
        db.commit()
        return {"id": a.id, "path": dest}
@r.get("")
def list_cases(
    status: str | None = None,
    mine: bool = False,
    q: str | None = None,
    limit: int = 20,
    user=Depends(get_current_user)
):
    from sqlalchemy import or_
    with SessionLocal() as db:
        qry = db.query(Case).join(Client)
        if status:
            qry = qry.filter(Case.status == status)
        if mine:
            qry = qry.filter(Case.assigned_user_id == user.id)
        if q:
            like = f"%{q}%"
            qry = qry.filter(or_(Client.name.ilike(like), Client.cpf.ilike(like), Client.matricula.ilike(like)))
        qry = qry.order_by(Case.id.desc()).limit(limit)
        rows = []
        for c in qry.all():
            rows.append({
                "id": c.id,
                "status": c.status,
                "assigned_user_id": c.assigned_user_id,
                "client": {
                    "id": c.client.id,
                    "name": c.client.name,
                    "cpf": c.client.cpf,
                    "matricula": c.client.matricula,
                }
            })
        return {"items": rows}

@r.post("/{case_id}/to-calculista")
async def to_calculista(case_id:int, user=Depends(require_roles("admin","supervisor","atendente"))):
    from ..models import Simulation, CaseEvent
    from ..events import eventbus
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        sim = Simulation(case_id=c.id, status="pending", created_by=user.id)
        db.add(sim)
        c.status = "calculista_pendente"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="case.to_calculista", payload={"simulation_id": None}, created_by=user.id))
        db.commit()
        db.refresh(sim)
    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "calculista_pendente"})
    return {"simulation_id": sim.id}
