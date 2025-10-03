from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import Case, Client, Simulation, CaseEvent
from ..events import eventbus
from ..constants import enrich_banks_with_names
from ..services.simulation_service import (
    SimulationInput,
    compute_simulation_totals,
    validate_simulation_input
)
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func

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
def list_pending(
    status: str = "draft",
    limit: int = 50,
    date: str = None,
    include_completed_today: bool = False,  # NOVO parâmetro
    user=Depends(require_roles("admin","supervisor","calculista"))
):
    """
    Lista simulações pendentes ou concluídas.

    Parâmetros:
    - status: Status da simulação (draft, approved, rejected)
    - limit: Número máximo de resultados
    - date: Filtro por data ("today")
    - include_completed_today: Se True, inclui simulações approved/rejected de hoje junto com draft
    """
    with SessionLocal() as db:
        from datetime import datetime
        from sqlalchemy import or_, and_

        # Base query
        q = db.query(Simulation, Case, Client).join(Case, Simulation.case_id==Case.id).join(Client, Case.client_id==Client.id)

        # Filtro de status com suporte para múltiplos
        if include_completed_today:
            # Inclui draft + approved/rejected de hoje
            today = datetime.utcnow().date()
            q = q.filter(
                or_(
                    Simulation.status == "draft",
                    and_(
                        Simulation.status.in_(["approved", "rejected"]),
                        func.date(Simulation.updated_at) == today
                    )
                )
            )
        else:
            # Apenas o status especificado
            q = q.filter(Simulation.status == status)

        # Filtro por data se especificado
        if date == "today":
            today = datetime.utcnow().date()
            q = q.filter(func.date(Simulation.updated_at) == today)

        # Aplicar ordenação e limite
        q = q.order_by(Simulation.updated_at.desc(), Simulation.id.desc()).limit(limit)

        items=[]
        for sim, case, client in q.all():
            items.append({
                "id": sim.id,
                "case_id": case.id,
                "status": sim.status,
                "created_at": sim.created_at.isoformat() if sim.created_at else None,
                "updated_at": sim.updated_at.isoformat() if sim.updated_at else None,
                "case": {
                    "id": case.id,
                    "status": case.status,
                    "client_id": case.client_id
                },
                "client": {
                    "id": client.id,
                    "name": client.name,
                    "cpf": client.cpf
                },
                # Adicionar totais se simulação foi calculada
                "totals": {
                    "liberadoCliente": float(sim.liberado_cliente or 0)
                } if sim.status in ["approved", "rejected"] else None
            })

        count = len(items)
        print(f"[DEBUG] Found {count} simulations with status={status}, include_completed_today={include_completed_today}, date={date}")
        return {"items": items, "count": count}

@r.get("/retorno-fechamento")
def list_retorno_fechamento(user=Depends(require_roles("admin","supervisor","calculista"))):
    """
    Lista casos que retornaram do fechamento para revisão do calculista.
    Estes são casos que foram aprovados pelo fechamento e precisam de revisão final antes de ir para financeiro.
    """
    from sqlalchemy.orm import joinedload

    with SessionLocal() as db:
        cases = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status == "retorno_fechamento").order_by(Case.last_update_at.desc()).all()

        items = []
        for case in cases:
            sim_data = None
            if case.last_simulation_id:
                sim = db.get(Simulation, case.last_simulation_id)
                if sim and sim.status == "approved":
                    sim_data = {
                        "id": sim.id,
                        "status": sim.status,
                        "totals": {
                            "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                            "saldoTotal": float(sim.saldo_total or 0),
                            "liberadoTotal": float(sim.liberado_total or 0),
                            "seguroObrigatorio": float(sim.seguro or 0),
                            "totalFinanciado": float(sim.total_financiado or 0),
                            "valorLiquido": float(sim.valor_liquido or 0),
                            "custoConsultoria": float(sim.custo_consultoria or 0),
                            "liberadoCliente": float(sim.liberado_cliente or 0)
                        },
                        "banks": enrich_banks_with_names(sim.banks_json or []),
                        "prazo": sim.prazo,
                        "percentualConsultoria": float(sim.percentual_consultoria or 0)
                    }

            items.append({
                "id": case.id,
                "status": case.status,
                "client": {
                    "id": case.client.id,
                    "name": case.client.name,
                    "cpf": case.client.cpf,
                    "matricula": case.client.matricula
                },
                "simulation": sim_data,
                "last_update_at": case.last_update_at.isoformat() if case.last_update_at else None
            })

        return {"items": items, "count": len(items)}

class SimSave(BaseModel):
    manual_input: dict
    results: dict

@r.post("/{case_id}")
async def create_or_update_simulation(case_id: int, data: SimulationInput, user=Depends(require_roles("calculista","supervisor","admin"))):
    """
    Criar ou atualizar simulação em modo draft.
    Retorna os totais calculados.
    """
    with SessionLocal() as db:
        # Verificar se caso existe
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Validar entrada
        errors = validate_simulation_input(data)
        if errors:
            raise HTTPException(400, {"detail": "Dados inválidos", "errors": errors})

        # Calcular totais
        totals = compute_simulation_totals(data)

        # Verificar se já existe simulação draft para este caso
        existing_sim = db.query(Simulation).filter(
            Simulation.case_id == case_id,
            Simulation.status == "draft"
        ).first()

        if existing_sim:
            # Atualizar simulação existente
            sim = existing_sim
        else:
            # Criar nova simulação
            sim = Simulation(case_id=case_id, status="draft", created_by=user.id)
            db.add(sim)

        # Atualizar dados
        sim.banks_json = [bank.dict() for bank in data.banks]
        sim.prazo = data.prazo
        sim.coeficiente = data.coeficiente
        sim.seguro = Decimal(str(data.seguro))
        sim.percentual_consultoria = Decimal(str(data.percentualConsultoria))

        # Salvar totais calculados
        sim.valor_parcela_total = Decimal(str(totals.valorParcelaTotal))
        sim.saldo_total = Decimal(str(totals.saldoTotal))
        sim.liberado_total = Decimal(str(totals.liberadoTotal))
        sim.total_financiado = Decimal(str(totals.totalFinanciado))
        sim.valor_liquido = Decimal(str(totals.valorLiquido))
        sim.custo_consultoria = Decimal(str(totals.custoConsultoria))
        sim.custo_consultoria_liquido = Decimal(str(totals.custoConsultoriaLiquido))
        sim.liberado_cliente = Decimal(str(totals.liberadoCliente))
        sim.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(sim)

        return {
            "id": sim.id,
            "status": sim.status,
            "totals": totals.dict()
        }

@r.post("/{sim_id}/approve")
async def approve(sim_id: int, user=Depends(require_roles("calculista","admin","supervisor"))):
    """Aprovar simulação"""
    from ..routers.notifications import notify_case_status_change

    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status != "draft":
            raise HTTPException(400, "Apenas simulações em draft podem ser aprovadas")

        # Atualizar status da simulação
        sim.status = "approved"
        sim.updated_at = datetime.utcnow()

        # Atualizar caso
        case = db.get(Case, sim.case_id)
        case.status = "calculo_aprovado"
        case.last_simulation_id = sim.id
        case.last_update_at = datetime.utcnow()

        # Adicionar simulação ao histórico
        if not case.simulation_history:
            case.simulation_history = []

        history_entry = {
            "simulation_id": sim.id,
            "action": "approved",
            "status": "approved",
            "timestamp": datetime.utcnow().isoformat(),
            "approved_by": user.id,
            "approved_by_name": user.name,
            "totals": {
                "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                "saldoTotal": float(sim.saldo_total or 0),
                "liberadoTotal": float(sim.liberado_total or 0),
                    "seguroObrigatorio": float(sim.seguro or 0),  # NOVO
                "totalFinanciado": float(sim.total_financiado or 0),
                "valorLiquido": float(sim.valor_liquido or 0),
                "custoConsultoria": float(sim.custo_consultoria or 0),
                "custoConsultoriaLiquido": float(sim.custo_consultoria_liquido or 0),
                "liberadoCliente": float(sim.liberado_cliente or 0)
            },
            "banks": enrich_banks_with_names(sim.banks_json or []),
            "prazo": sim.prazo,
            "percentualConsultoria": float(sim.percentual_consultoria or 0)
        }

        case.simulation_history.append(history_entry)

        # Criar evento
        db.add(CaseEvent(
            case_id=case.id,
            type="simulation.approved",
            payload={
                "simulation_id": sim.id,
                "liberado_cliente": float(sim.liberado_cliente or 0),
                "total_financiado": float(sim.total_financiado or 0)
            },
            created_by=user.id
        ))

        db.commit()

    # Notificar atendente responsável
    notify_user_ids = []
    if case.assigned_user_id:
        notify_user_ids.append(case.assigned_user_id)

    if notify_user_ids:
        await notify_case_status_change(
            case_id=case.id,
            new_status="calculo_aprovado",
            changed_by_user_id=user.id,
            notify_user_ids=notify_user_ids,
            additional_payload={
                "liberado_cliente": float(sim.liberado_cliente or 0),
                "total_financiado": float(sim.total_financiado or 0)
            }
        )

    await eventbus.broadcast("simulation.updated", {"simulation_id": sim_id, "status": "approved"})
    await eventbus.broadcast("case.updated", {"case_id": sim.case_id, "status": "calculo_aprovado"})
    return {"ok": True}

class RejectInput(BaseModel):
    reason: str = "Simulação rejeitada pelo calculista"

@r.post("/{sim_id}/reject")
async def reject(sim_id: int, data: RejectInput, user=Depends(require_roles("calculista","admin","supervisor"))):
    """Rejeitar simulação"""
    from ..routers.notifications import notify_case_status_change

    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status != "draft":
            raise HTTPException(400, "Apenas simulações em draft podem ser rejeitadas")

        # Atualizar status da simulação
        sim.status = "rejected"
        sim.updated_at = datetime.utcnow()

        # Atualizar caso
        case = db.get(Case, sim.case_id)
        case.status = "calculo_rejeitado"
        case.last_update_at = datetime.utcnow()

        # Adicionar simulação ao histórico
        if not case.simulation_history:
            case.simulation_history = []

        history_entry = {
            "simulation_id": sim.id,
            "action": "rejected",
            "status": "rejected",
            "timestamp": datetime.utcnow().isoformat(),
            "rejected_by": user.id,
            "rejected_by_name": user.name,
            "reason": data.reason,
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
            "banks": enrich_banks_with_names(sim.banks_json or []),
            "prazo": sim.prazo,
            "percentualConsultoria": float(sim.percentual_consultoria or 0)
        }

        case.simulation_history.append(history_entry)

        # Criar evento
        db.add(CaseEvent(
            case_id=case.id,
            type="simulation.rejected",
            payload={
                "simulation_id": sim.id,
                "reason": data.reason
            },
            created_by=user.id
        ))

        db.commit()

    # Notificar atendente responsável
    notify_user_ids = []
    if case.assigned_user_id:
        notify_user_ids.append(case.assigned_user_id)

    if notify_user_ids:
        await notify_case_status_change(
            case_id=case.id,
            new_status="calculo_rejeitado",
            changed_by_user_id=user.id,
            notify_user_ids=notify_user_ids,
            additional_payload={"reason": data.reason}
        )

    await eventbus.broadcast("simulation.updated", {"simulation_id": sim_id, "status": "rejected"})
    await eventbus.broadcast("case.updated", {"case_id": sim.case_id, "status": "calculo_rejeitado"})
    return {"ok": True}

@r.get("/{case_id}/history")
def get_simulation_history(case_id: int, user=Depends(require_roles("calculista","admin","supervisor","atendente"))):
    """
    Retorna o histórico de simulações de um caso (aprovadas e rejeitadas).
    Enriquece a lista de bancos com bank_name se não existir.
    """
    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        history = case.simulation_history or []

        # Enriquecer histórico com nomes de bancos se necessário
        enriched_history = []
        for entry in history:
            enriched_entry = entry.copy()
            banks = entry.get("banks", [])

            # Se algum banco não tem bank_name, enriquecer a lista
            if banks and not any("bank_name" in bank for bank in banks):
                enriched_entry["banks"] = enrich_banks_with_names(banks)

            enriched_history.append(enriched_entry)

        # Ordenar por timestamp (mais recente primeiro)
        history_sorted = sorted(enriched_history, key=lambda x: x.get("timestamp", ""), reverse=True)

        return {"items": history_sorted, "count": len(history_sorted)}

@r.post("/{sim_id}/reopen")
async def reopen_simulation(sim_id: int, user=Depends(require_roles("calculista","admin","supervisor"))):
    """
    Reabre uma simulação aprovada ou rejeitada para edição.
    Muda o status de volta para 'draft' e atualiza o status do caso.
    """
    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status not in ["approved", "rejected"]:
            raise HTTPException(400, "Apenas simulações aprovadas ou rejeitadas podem ser reabertas")

        # Salvar status anterior
        previous_status = sim.status

        # Reabrir simulação
        sim.status = "draft"
        sim.updated_at = datetime.utcnow()

        # Atualizar caso
        case = db.get(Case, sim.case_id)
        case.status = "calculista_pendente"
        case.last_update_at = datetime.utcnow()

        # Criar evento
        db.add(CaseEvent(
            case_id=case.id,
            type="simulation.reopened",
            payload={
                "simulation_id": sim.id,
                "previous_status": previous_status,
                "reopened_by": user.id
            },
            created_by=user.id
        ))

        db.commit()

    await eventbus.broadcast("simulation.updated", {"simulation_id": sim_id, "status": "draft"})
    await eventbus.broadcast("case.updated", {"case_id": sim.case_id, "status": "calculista_pendente"})

    return {"ok": True, "message": "Simulação reaberta para edição"}

@r.post("/{case_id}/send-to-finance")
async def send_to_finance(case_id: int, user=Depends(require_roles("calculista","admin","supervisor"))):
    """
    Envia caso para financeiro após revisão do fechamento aprovado.
    Usado quando o calculista revisa uma simulação aprovada pelo fechamento.
    """
    from ..routers.notifications import notify_case_status_change

    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Permitir envio ao financeiro tanto para casos marcados como 'retorno_fechamento'
        # quanto para casos já aprovados no fechamento ('fechamento_aprovado')
        if case.status not in ("retorno_fechamento", "fechamento_aprovado"):
            raise HTTPException(400, "Apenas casos de retorno de fechamento ou fechamento aprovado podem ser enviados para financeiro")

        # Verificar se tem simulação aprovada
        if not case.last_simulation_id:
            raise HTTPException(400, "Caso não possui simulação aprovada")

        sim = db.get(Simulation, case.last_simulation_id)
        if not sim or sim.status != "approved":
            raise HTTPException(400, "Simulação do caso não está aprovada")

        # Atualizar status do caso
        case.status = "financeiro_pendente"
        case.last_update_at = datetime.utcnow()

        # Criar evento
        db.add(CaseEvent(
            case_id=case.id,
            type="case.sent_to_finance",
            payload={
                "simulation_id": sim.id,
                "sent_by": user.id
            },
            created_by=user.id
        ))

        db.commit()

    # Notificar usuários do financeiro
    notify_user_ids = []
    from ..models import User
    finance_users = db.query(User).filter(User.role == "financeiro", User.active == True).all()
    for fu in finance_users:
        notify_user_ids.append(fu.id)

    if notify_user_ids:
        await notify_case_status_change(
            case_id=case.id,
            new_status="financeiro_pendente",
            changed_by_user_id=user.id,
            notify_user_ids=notify_user_ids,
            additional_payload={"simulation_id": sim.id}
        )

    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "financeiro_pendente"})

    return {"ok": True, "message": "Caso enviado para financeiro"}
