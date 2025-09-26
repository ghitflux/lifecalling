from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import Case, Simulation, CaseEvent
from ..events import eventbus
from datetime import datetime

r = APIRouter(prefix="/simulations", tags=["simulations"])

class SimCreate(BaseModel):
    case_id: int

@r.post("")
async def create_sim(data: SimCreate, user=Depends(require_roles("admin","supervisor","calculista","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        # cria pendência para calculista
        sim = Simulation(case_id=c.id, status="pending", created_by=user.id)
        db.add(sim)
        c.status = "calculista_pendente"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="case.to_calculista", payload={"case_id": c.id}, created_by=user.id))
        db.commit()
        db.refresh(sim)
    await eventbus.broadcast("case.updated", {"case_id": c.id, "status": "calculista_pendente"})
    return {"id": sim.id, "status": sim.status}

@r.get("")
def list_pending(status: str = "pending", limit:int=50, user=Depends(require_roles("admin","supervisor","calculista"))):
    with SessionLocal() as db:
        q = db.query(Simulation, Case).join(Case, Simulation.case_id==Case.id).filter(Simulation.status==status).order_by(Simulation.id.desc()).limit(limit)
        items=[]
        for sim, case in q.all():
            items.append({"id": sim.id, "case_id": case.id, "status": sim.status, "case": {
                "id": case.id, "status": case.status, "client_id": case.client_id
            }})
        return {"items": items}

class SimSave(BaseModel):
    manual_input: dict
    results: dict

@r.post("/{sim_id}/approve")
async def approve(sim_id:int, data: SimSave, user=Depends(require_roles("calculista","admin","supervisor"))):
    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "sim not found")
        sim.manual_input = data.manual_input
        sim.results = data.results
        sim.status = "approved"
        sim.updated_at = datetime.utcnow()
        case = db.get(Case, sim.case_id)
        case.status = "calculo_aprovado"
        case.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=case.id, type="simulation.approved", payload=sim.results, created_by=user.id))
        db.commit()
    await eventbus.broadcast("simulation.updated", {"simulation_id": sim_id, "status":"approved"})
    await eventbus.broadcast("case.updated", {"case_id": sim.case_id, "status":"calculo_aprovado"})
    return {"ok": True}

@r.post("/{sim_id}/reject")
async def reject(sim_id:int, data: SimSave, user=Depends(require_roles("calculista","admin","supervisor"))):
    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "sim not found")
        sim.manual_input = data.manual_input
        sim.results = data.results
        sim.status = "rejected"
        sim.updated_at = datetime.utcnow()
        case = db.get(Case, sim.case_id)
        case.status = "calculo_reprovado"
        case.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=case.id, type="simulation.rejected", payload=sim.results, created_by=user.id))
        db.commit()
    await eventbus.broadcast("simulation.updated", {"simulation_id": sim_id, "status":"rejected"})
    await eventbus.broadcast("case.updated", {"case_id": sim.case_id, "status":"calculo_reprovado"})
    return {"ok": True}
