from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import joinedload
from ..db import SessionLocal
from ..models import Case, CaseEvent
from ..rbac import require_roles
from ..events import eventbus

r = APIRouter(prefix="/closing", tags=["closing"])

@r.get("/queue")
def queue(user=Depends(require_roles("admin","supervisor","atendente"))):
    from ..models import Simulation
    with SessionLocal() as db:
        # Query com JOIN para carregar dados completos
        # Incluir todos os status relevantes para o módulo de fechamento
        rows = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status.in_(["calculo_aprovado", "fechamento_pendente", "fechamento_aprovado", "fechamento_reprovado"])).order_by(Case.id.desc()).all()

        items = []
        for c in rows:
            try:
                # Buscar simulação aprovada
                simulation_data = None
                if c.last_simulation_id:
                    sim = db.get(Simulation, c.last_simulation_id)
                    if sim and sim.status == "approved":
                        simulation_data = {
                            "id": sim.id,
                            "status": sim.status,
                            "totals": {
                                "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                                "saldoTotal": float(sim.saldo_total or 0),
                                "liberadoTotal": float(sim.liberado_total or 0),
                    "seguroObrigatorio": float(sim.seguro or 0),  # NOVO
                                "totalFinanciado": float(sim.total_financiado or 0),
                                "valorLiquido": float(sim.valor_liquido or 0),
                                "custoConsultoria": float(sim.custo_consultoria or 0),
                                "liberadoCliente": float(sim.liberado_cliente or 0)
                            },
                            "banks": sim.banks_json,
                            "prazo": sim.prazo,
                            "percentualConsultoria": float(sim.percentual_consultoria or 0)
                        }

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
                    "created_at": c.last_update_at.isoformat() if c.last_update_at else datetime.utcnow().isoformat(),
                    "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
                    "banco": getattr(c, 'banco', None),
                    "simulation": simulation_data,
                    "contract": None  # TODO: adicionar se necessário
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
    from .notifications import notify_case_status_change
    from ..models import Simulation

    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        # Fechamento aprovado: marca caso como 'fechamento_aprovado'
        # Casos neste status aparecem para revisão final do calculista
        c.status = "fechamento_aprovado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="closing.approved", payload={"notes": data.notes}, created_by=user.id))
        db.commit()

        # Buscar usuários para notificar
        notify_user_ids = []

        # Notificar o atendente que está com o caso atribuído
        if c.assigned_user_id and c.assigned_user_id != user.id:
            notify_user_ids.append(c.assigned_user_id)

        # Notificar o calculista que fez a simulação
        if c.last_simulation_id:
            sim = db.get(Simulation, c.last_simulation_id)
            if sim and sim.created_by and sim.created_by != user.id:
                notify_user_ids.append(sim.created_by)

    # Notificar usuários afetados
    if notify_user_ids:
        await notify_case_status_change(
            case_id=c.id,
            new_status="fechamento_aprovado",
            changed_by_user_id=user.id,
            notify_user_ids=notify_user_ids,
            additional_payload={"notes": data.notes}
        )

    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"fechamento_aprovado"})
    return {"ok": True}

@r.post("/reject")
async def reject(data: CloseIn, user=Depends(require_roles("admin","supervisor","atendente"))):
    from .notifications import notify_case_status_change
    from ..models import Simulation

    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        c.status = "fechamento_reprovado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="closing.rejected", payload={"notes": data.notes}, created_by=user.id))
        db.commit()

        # Buscar usuários para notificar
        notify_user_ids = []

        # Notificar o atendente que está com o caso atribuído
        if c.assigned_user_id and c.assigned_user_id != user.id:
            notify_user_ids.append(c.assigned_user_id)

        # Notificar o calculista que fez a simulação
        if c.last_simulation_id:
            sim = db.get(Simulation, c.last_simulation_id)
            if sim and sim.created_by and sim.created_by != user.id:
                notify_user_ids.append(sim.created_by)

    # Notificar usuários afetados
    if notify_user_ids:
        await notify_case_status_change(
            case_id=c.id,
            new_status="fechamento_reprovado",
            changed_by_user_id=user.id,
            notify_user_ids=notify_user_ids,
            additional_payload={"notes": data.notes}
        )

    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"fechamento_reprovado"})
    return {"ok": True}
