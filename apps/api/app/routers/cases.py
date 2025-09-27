from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import or_
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

class PageOut(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int

class CasePatch(BaseModel):
    telefone_preferencial: str | None = None
    numero_cliente: str | None = None
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
          "telefone_preferencial": c.client.telefone_preferencial,
          "numero_cliente": getattr(c.client, 'numero_cliente', None),
          "observacoes": getattr(c.client, 'observacoes', None)
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
        if data.numero_cliente is not None:
            if hasattr(c.client, 'numero_cliente'):
                c.client.numero_cliente = data.numero_cliente
        if data.observacoes is not None:
            if hasattr(c.client, 'observacoes'):
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
@r.get("", response_model=PageOut)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: str | None = None,
    status: str | None = None,
    assigned: int | None = None,        # 0 = não atribuídos
    mine: bool = Query(False),          # True = meus casos atribuídos
    order: str = Query("id_desc"),       # id_desc | id_asc | updated_desc
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    with SessionLocal() as db:
        try:
            # Query mais simples para debug
            qry = db.query(Case)

            # Aplicar filtros apenas se fornecidos
            if status:
                qry = qry.filter(Case.status == status)
            if mine:
                qry = qry.filter(Case.assigned_user_id == user.id)
            elif assigned is not None:
                if assigned == 0:
                    qry = qry.filter(Case.assigned_user_id.is_(None))
                else:
                    qry = qry.filter(Case.assigned_user_id == assigned)

            # Se há busca por texto, precisamos do JOIN com Client
            if q:
                qry = qry.join(Client, Client.id == Case.client_id)
                like = f"%{q}%"
                qry = qry.filter(or_(Client.name.ilike(like), Client.cpf.ilike(like)))

            total = qry.count()

            # Aplicar ordenação
            if order == "id_asc":
                qry = qry.order_by(Case.id.asc())
            elif order == "updated_desc":
                qry = qry.order_by(Case.last_update_at.desc().nullslast(), Case.id.desc())
            else:
                qry = qry.order_by(Case.id.desc())

            # Eager loading para relacionamentos
            from sqlalchemy.orm import joinedload
            qry = qry.options(joinedload(Case.client), joinedload(Case.assigned_user))

            rows = qry.offset((page-1)*page_size).limit(page_size).all()
            items = []

            for c in rows:
                try:
                    item = {
                        "id": c.id,
                        "status": c.status or "novo",
                        "client_id": c.client_id,
                        "assigned_user_id": c.assigned_user_id,
                        "assigned_to": c.assigned_user.name if c.assigned_user else None,
                        "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
                        "created_at": None,  # Campo não existe no modelo Case
                        "banco": getattr(c, 'banco', None),
                    }

                    # Client info - verificar se existe
                    if hasattr(c, 'client') and c.client:
                        item["client"] = {
                            "name": c.client.name or "Nome não informado",
                            "cpf": c.client.cpf or "",
                            "matricula": c.client.matricula or ""
                        }
                    else:
                        # Se não tem client, vamos buscar separadamente
                        client = db.get(Client, c.client_id) if c.client_id else None
                        if client:
                            item["client"] = {
                                "name": client.name or "Nome não informado",
                                "cpf": client.cpf or "",
                                "matricula": client.matricula or ""
                            }
                        else:
                            item["client"] = {
                                "name": "Cliente não encontrado",
                                "cpf": "",
                                "matricula": ""
                            }

                    items.append(item)
                except Exception as e:
                    print(f"Erro ao processar caso {c.id}: {e}")
                    # Adicionar item mínimo para não perder o caso
                    items.append({
                        "id": c.id,
                        "status": "erro",
                        "client_id": c.client_id,
                        "assigned_user_id": c.assigned_user_id,
                        "assigned_to": None,
                        "last_update_at": None,
                        "created_at": None,
                        "banco": None,
                        "client": {"name": "Erro ao carregar", "cpf": "", "matricula": ""}
                    })

            return {"items": items, "total": total, "page": page, "page_size": page_size}

        except Exception as e:
            print(f"Erro na query de casos: {e}")
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "error": str(e)}

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
