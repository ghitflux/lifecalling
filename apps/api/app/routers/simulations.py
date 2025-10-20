from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import Case, Client, Simulation, CaseEvent, now_brt
from ..events import eventbus
from ..constants import enrich_banks_with_names
from ..services.simulation_service import (
    SimulationInput,
    compute_simulation_totals,
    validate_simulation_input
)
from decimal import Decimal
from sqlalchemy import func
from datetime import datetime

r = APIRouter(prefix="/simulations", tags=["simulations"])


class SimCreate(BaseModel):
    case_id: int


@r.post("")
async def create_sim(
    data: SimCreate,
    user=Depends(require_roles(
        "admin", "supervisor", "calculista", "atendente"
    ))
):
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        # cria pendência para calculista
        sim = Simulation(case_id=c.id, status="pending", created_by=user.id)
        db.add(sim)
        c.status = "calculista_pendente"
        c.last_update_at = now_brt()
        db.add(CaseEvent(
            case_id=c.id,
            type="case.to_calculista",
            payload={"case_id": c.id},
            created_by=user.id
        ))
        db.commit()
        db.refresh(sim)
    await eventbus.broadcast(
        "case.updated",
        {"case_id": c.id, "status": "calculista_pendente"}
    )
    return {"id": sim.id, "status": sim.status}


@r.get("")
def list_pending(
    status: str = "draft",
    limit: int = 50,
    date: str = None,
    include_completed_today: bool = False,  # NOVO parâmetro
    all: bool = False,  # NOVO parâmetro para retornar todas as simulações
    search: str = None,  # NOVO parâmetro para busca
    page: int = 1,  # NOVO parâmetro para paginação
    page_size: int = 20,  # NOVO parâmetro para paginação
    case_status: str = None,  # NOVO parâmetro para filtrar por status do caso
    user=Depends(require_roles(
        "admin", "supervisor", "calculista", "fechamento"
    ))
):

    with SessionLocal() as db:
        from sqlalchemy import or_, and_

        # Base query
        q = db.query(Simulation, Case, Client).join(
            Case, Simulation.case_id == Case.id
        ).join(Client, Case.client_id == Client.id)

        # Filtro de busca se fornecido
        if search:
            search_term = f"%{search}%"
            q = q.filter(
                or_(
                    Client.name.ilike(search_term),
                    Client.cpf.ilike(search_term)
                )
            )

        # Filtro de status com suporte para múltiplos
        if all:
            # Retorna todas as simulações sem filtro de status
            pass
        elif include_completed_today:
            # Inclui draft + approved/rejected de hoje
            today = now_brt().date()
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

        # Filtro por status do caso se especificado
        if case_status:
            q = q.filter(Case.status == case_status)

        # Filtro por data se especificado (não aplicar quando all=true)
        if date == "today" and not all:
            today = now_brt().date()
            q = q.filter(func.date(Simulation.updated_at) == today)

        # Contar total de resultados
        total_count = q.count()

        # Aplicar paginação
        offset = (page - 1) * page_size
        q = q.order_by(
            Simulation.updated_at.desc(), Simulation.id.desc()
        ).offset(offset).limit(page_size)

        items = []
        for sim, case, client in q.all():
            items.append({
                "id": sim.id,
                "case_id": case.id,
                "status": sim.status,
                "created_at": (
                    sim.created_at.isoformat() if sim.created_at else None
                ),
                "updated_at": (
                    sim.updated_at.isoformat() if sim.updated_at else None
                ),
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
                } if sim.status in ["approved", "rejected"] else None,
                "observacao_calculista": sim.observacao_calculista
            })

        count = len(items)
        print(
            f"[DEBUG] Found {count} simulations with status={status}, "
            f"include_completed_today={include_completed_today}, date={date}"
        )
        return {
            "items": items,
            "count": count,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size
        }


@r.get("/retorno-fechamento")
def list_retorno_fechamento(
    user=Depends(require_roles(
        "admin", "supervisor", "calculista", "fechamento"
    ))
):
    """
    Endpoint para listar casos aprovados pelo fechamento.
    Retorna casos com status 'fechamento_aprovado' para revisão do calculista.
    """
    from sqlalchemy.orm import joinedload

    with SessionLocal() as db:
        cases = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status == "fechamento_aprovado").order_by(
            Case.last_update_at.desc()
        ).all()

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
                            "valorParcelaTotal": float(
                                sim.valor_parcela_total or 0
                            ),
                            "saldoTotal": float(sim.saldo_total or 0),
                            "liberadoTotal": float(
                                sim.liberado_total or 0
                            ),
                            "seguroObrigatorio": float(
                                sim.seguro or 0
                            ),
                            "totalFinanciado": float(
                                sim.total_financiado or 0
                            ),
                            "valorLiquido": float(
                                sim.valor_liquido or 0
                            ),
                            "custoConsultoria": float(
                                sim.custo_consultoria or 0
                            ),
                            "liberadoCliente": float(
                                sim.liberado_cliente or 0
                            )
                        },
                        "banks": enrich_banks_with_names(sim.banks_json or []),
                        "prazo": sim.prazo,
                        "percentualConsultoria": float(
                            sim.percentual_consultoria or 0
                        ),
                        "observacao_calculista": sim.observacao_calculista
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
                "last_update_at": (
                    case.last_update_at.isoformat()
                    if case.last_update_at
                    else None
                )
            })

        return {"items": items, "count": len(items)}


class SimSave(BaseModel):
    manual_input: dict
    results: dict


@r.post("/{case_id}")
async def create_or_update_simulation(
    case_id: int,
    data: SimulationInput,
    user=Depends(require_roles("calculista", "supervisor", "admin"))
):
    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        errors = validate_simulation_input(data)
        if errors:
            raise HTTPException(
                400, {"detail": "Dados inválidos", "errors": errors}
            )

        totals = compute_simulation_totals(data)

        # NOVA LÓGICA: Marcar todas as simulações draft antigas como "superseded"
        old_drafts = db.query(Simulation).filter(
            Simulation.case_id == case_id,
            Simulation.status == "draft"
        ).all()

        for old_sim in old_drafts:
            old_sim.status = "superseded"
            old_sim.updated_at = now_brt()

        # SEMPRE criar uma nova simulação
        sim = Simulation(
            case_id=case_id,
            status="draft",
            created_by=user.id
        )
        db.add(sim)

        sim.banks_json = [bank.dict() for bank in data.banks]
        sim.prazo = data.prazo
        sim.coeficiente = data.coeficiente
        sim.seguro = Decimal(str(data.seguro))
        sim.percentual_consultoria = Decimal(
            str(data.percentualConsultoria)
        )
        sim.observacao_calculista = (
            data.observacaoCalculista if data.observacaoCalculista else None
        )

        # Salvar totais calculados
        sim.valor_parcela_total = Decimal(str(totals.valorParcelaTotal))
        sim.saldo_total = Decimal(str(totals.saldoTotal))
        sim.liberado_total = Decimal(str(totals.liberadoTotal))
        sim.total_financiado = Decimal(str(totals.totalFinanciado))
        sim.valor_liquido = Decimal(str(totals.valorLiquido))
        sim.custo_consultoria = Decimal(str(totals.custoConsultoria))
        sim.custo_consultoria_liquido = Decimal(
            str(totals.custoConsultoriaLiquido)
        )
        sim.liberado_cliente = Decimal(str(totals.liberadoCliente))
        sim.updated_at = now_brt()

        db.commit()
        db.refresh(sim)

        # Atualizar last_simulation_id para apontar sempre para a mais recente
        case.last_simulation_id = sim.id
        case.last_update_at = now_brt()

        # Adicionar entrada no histórico para draft
        if not case.simulation_history:
            case.simulation_history = []

        # Contar versões para identificação
        version_number = len([
            h for h in case.simulation_history
            if h.get("action") in ["draft", "approved", "rejected"]
        ]) + 1

        history_entry = {
            "simulation_id": sim.id,
            "action": "draft",
            "status": "draft",
            "timestamp": now_brt().isoformat(),
            "created_by": user.id,
            "created_by_name": user.name,
            "version_number": version_number,
            "totals": {
                "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                "saldoTotal": float(sim.saldo_total or 0),
                "liberadoTotal": float(sim.liberado_total or 0),
                "seguroObrigatorio": float(sim.seguro or 0),
                "totalFinanciado": float(sim.total_financiado or 0),
                "valorLiquido": float(sim.valor_liquido or 0),
                "custoConsultoria": float(sim.custo_consultoria or 0),
                "custoConsultoriaLiquido": float(
                    sim.custo_consultoria_liquido or 0
                ),
                "liberadoCliente": float(sim.liberado_cliente or 0)
            },
            "banks": enrich_banks_with_names(sim.banks_json or []),
            "prazo": sim.prazo,
            "coeficiente": sim.coeficiente or "",
            "percentualConsultoria": float(
                sim.percentual_consultoria or 0
            ),
            "observacao_calculista": sim.observacao_calculista
        }

        case.simulation_history.append(history_entry)

        db.add(CaseEvent(
            case_id=case.id,
            type="simulation.draft_saved",
            payload={
                "simulation_id": sim.id,
                "version_number": version_number
            },
            created_by=user.id
        ))

        db.commit()

        return {
            "id": sim.id,
            "status": sim.status,
            "totals": totals.dict(),
            "version_number": version_number
        }


@r.post("/{sim_id}/approve")
async def approve(
    sim_id: int,
    user=Depends(require_roles("calculista", "admin", "supervisor"))
):

    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status != "draft":
            raise HTTPException(
                400, "Apenas simulações em draft podem ser aprovadas"
            )

        sim.status = "approved"
        sim.updated_at = now_brt()

        case = db.get(Case, sim.case_id)

        # Determinar próximo status baseado no contexto
        # Se já passou pelo fechamento, vai direto para financeiro
        if case.status == "fechamento_aprovado":
            case.status = "financeiro_pendente"
        else:
            # Primeira aprovação, vai para fechamento
            case.status = "calculo_aprovado"

        case.last_simulation_id = sim.id
        case.last_update_at = now_brt()

        if not case.simulation_history:
            case.simulation_history = []

        history_entry = {
            "simulation_id": sim.id,
            "action": "approved",
            "status": "approved",
            "timestamp": now_brt().isoformat(),
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
                "custoConsultoriaLiquido": float(
                    sim.custo_consultoria_liquido or 0
                ),
                "liberadoCliente": float(sim.liberado_cliente or 0)
            },
            "banks": enrich_banks_with_names(sim.banks_json or []),
            "prazo": sim.prazo,
            "coeficiente": sim.coeficiente or "",
            "percentualConsultoria": float(
                sim.percentual_consultoria or 0
            )
        }

        case.simulation_history.append(history_entry)

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

        # Se vai direto para financeiro, registrar evento adicional
        if case.status == "financeiro_pendente":
            db.add(CaseEvent(
                case_id=case.id,
                type="case.sent_to_finance",
                payload={
                    "simulation_id": sim.id,
                    "sent_by": user.id,
                    "auto_sent": True,
                    "reason": "Aprovado após retorno do fechamento"
                },
                created_by=user.id
            ))

        db.commit()

    # Obter status final do caso após aprovação
    with SessionLocal() as db:
        case = db.get(Case, sim.case_id)
        final_status = case.status

    await eventbus.broadcast(
        "simulation.updated", {"simulation_id": sim_id, "status": "approved"}
    )
    await eventbus.broadcast(
        "case.updated", {"case_id": sim.case_id, "status": final_status}
    )
    return {"ok": True, "case_status": final_status}


class RejectInput(BaseModel):
    reason: str = "Simulação rejeitada pelo calculista"


@r.post("/{sim_id}/reject")
async def reject(
    sim_id: int,
    data: RejectInput,
    user=Depends(require_roles("calculista", "admin", "supervisor"))
):
    """Rejeitar simulação"""

    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status != "draft":
            raise HTTPException(
                400, "Apenas simulações em draft podem ser rejeitadas"
            )

        sim.status = "rejected"
        sim.updated_at = now_brt()

        case = db.get(Case, sim.case_id)
        case.status = "calculo_rejeitado"
        case.last_update_at = now_brt()

        if not case.simulation_history:
            case.simulation_history = []

        history_entry = {
            "simulation_id": sim.id,
            "action": "rejected",
            "status": "rejected",
            "timestamp": now_brt().isoformat(),
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
            "coeficiente": sim.coeficiente or "",
            "percentualConsultoria": float(
                sim.percentual_consultoria or 0
            )
        }

        case.simulation_history.append(history_entry)

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

    await eventbus.broadcast(
        "simulation.updated", {"simulation_id": sim_id, "status": "rejected"}
    )
    await eventbus.broadcast(
        "case.updated", {"case_id": sim.case_id, "status": "calculo_rejeitado"}
    )
    return {"ok": True}


@r.get("/case/{case_id}/all")
def get_all_case_simulations(
    case_id: int,
    user=Depends(require_roles(
        "calculista", "admin", "supervisor", "atendente", "fechamento"
    ))
):
    """
    Retorna TODAS as simulações de um caso (draft, superseded, approved, rejected).
    Ordenadas por created_at DESC (mais recente primeiro).
    Inclui flag is_current para destacar a simulação atual.
    """
    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Buscar todas as simulações do caso
        simulations = db.query(Simulation).filter(
            Simulation.case_id == case_id
        ).order_by(Simulation.created_at.desc()).all()

        items = []
        for sim in simulations:
            # Verificar se é a simulação atual
            is_current = (case.last_simulation_id == sim.id)

            items.append({
                "id": sim.id,
                "status": sim.status,
                "is_current": is_current,
                "created_at": sim.created_at.isoformat() if sim.created_at else None,
                "updated_at": sim.updated_at.isoformat() if sim.updated_at else None,
                "created_by": sim.created_by,
                "totals": {
                    "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                    "saldoTotal": float(sim.saldo_total or 0),
                    "liberadoTotal": float(sim.liberado_total or 0),
                    "seguroObrigatorio": float(sim.seguro or 0),
                    "totalFinanciado": float(sim.total_financiado or 0),
                    "valorLiquido": float(sim.valor_liquido or 0),
                    "custoConsultoria": float(sim.custo_consultoria or 0),
                    "custoConsultoriaLiquido": float(
                        sim.custo_consultoria_liquido or 0
                    ),
                    "liberadoCliente": float(sim.liberado_cliente or 0)
                } if sim.status not in ["pending"] else None,
                "banks": enrich_banks_with_names(sim.banks_json or []),
                "prazo": sim.prazo,
                "coeficiente": sim.coeficiente or "",
                "percentualConsultoria": float(sim.percentual_consultoria or 0),
                "observacao_calculista": sim.observacao_calculista
            })

        return {
            "items": items,
            "count": len(items),
            "current_simulation_id": case.last_simulation_id
        }


@r.get("/{case_id}/history")
def get_simulation_history(
    case_id: int,
    user=Depends(require_roles(
        "calculista", "admin", "supervisor", "atendente", "fechamento"
    ))
):
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
            if banks and not any(
                "bank_name" in bank for bank in banks
            ):
                enriched_entry["banks"] = enrich_banks_with_names(banks)

            enriched_history.append(enriched_entry)

        # Ordenar por timestamp (mais recente primeiro)
        history_sorted = sorted(
            enriched_history,
            key=lambda x: x.get("timestamp", ""),
            reverse=True
        )

        return {"items": history_sorted, "count": len(history_sorted)}


@r.post("/{sim_id}/reopen")
async def reopen_simulation(
    sim_id: int,
    user=Depends(require_roles("calculista", "admin", "supervisor"))
):
    """
    Reabre uma simulação aprovada ou rejeitada para edição.
    Muda o status de volta para 'draft' e atualiza o status do caso.
    """
    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status not in ["approved", "rejected"]:
            raise HTTPException(
                400,
                "Apenas simulações aprovadas ou rejeitadas podem ser reabertas"
            )

        # Salvar status anterior
        previous_status = sim.status

        # Reabrir simulação
        sim.status = "draft"
        sim.updated_at = now_brt()

        case = db.get(Case, sim.case_id)
        case.status = "calculista_pendente"
        case.last_update_at = now_brt()

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

    await eventbus.broadcast(
        "simulation.updated",
        {"simulation_id": sim_id, "status": "draft"}
    )
    await eventbus.broadcast(
        "case.updated",
        {"case_id": sim.case_id, "status": "calculista_pendente"}
    )

    return {"ok": True, "message": "Simulação reaberta para edição"}


@r.post("/{sim_id}/set-as-final")
async def set_simulation_as_final(
    sim_id: int,
    user=Depends(require_roles("calculista", "admin", "supervisor"))
):
    """
    Define uma simulação aprovada como a simulação final do caso.
    Atualiza o campo Case.last_simulation_id.
    Permite escolher qual simulação aprovada será enviada ao financeiro.
    """
    with SessionLocal() as db:
        sim = db.get(Simulation, sim_id)
        if not sim:
            raise HTTPException(404, "Simulação não encontrada")

        if sim.status != "approved":
            raise HTTPException(
                400,
                "Apenas simulações aprovadas podem ser definidas como final"
            )

        case = db.get(Case, sim.case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Atualizar last_simulation_id
        previous_final_id = case.last_simulation_id
        case.last_simulation_id = sim.id
        case.last_update_at = now_brt()

        # Registrar evento
        db.add(CaseEvent(
            case_id=case.id,
            type="simulation.set_as_final",
            payload={
                "simulation_id": sim.id,
                "previous_final_id": previous_final_id,
                "set_by": user.id
            },
            created_by=user.id
        ))

        db.commit()

    await eventbus.broadcast(
        "simulation.updated",
        {"simulation_id": sim_id, "is_final": True}
    )
    await eventbus.broadcast(
        "case.updated",
        {"case_id": sim.case_id, "last_simulation_id": sim_id}
    )

    return {
        "ok": True,
        "message": "Simulação definida como final",
        "simulation_id": sim_id
    }


@r.post("/{case_id}/send-to-finance")
async def send_to_finance(
    case_id: int,
    user=Depends(require_roles("calculista", "admin", "supervisor"))
):

    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Permitir envio ao financeiro apenas para casos aprovados no fechamento
        if case.status != "fechamento_aprovado":
            raise HTTPException(
                400,
                "Apenas casos com fechamento aprovado "
                "podem ser enviados para financeiro"
            )

        # Verificar se tem simulação aprovada
        if not case.last_simulation_id:
            raise HTTPException(400, "Caso não possui simulação aprovada")

        sim = db.get(Simulation, case.last_simulation_id)
        if not sim or sim.status != "approved":
            raise HTTPException(400, "Simulação do caso não está aprovada")

        # Atualizar status do caso
        case.status = "financeiro_pendente"
        case.last_update_at = now_brt()

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

    await eventbus.broadcast(
        "case.updated", {"case_id": case_id, "status": "financeiro_pendente"}
    )

    return {"ok": True, "message": "Caso enviado para financeiro"}


# Adicionar novo router para KPIs de cálculo
calculation_router = APIRouter(prefix="/calculation", tags=["calculation"])


def _calculate_trend(current: float, previous: float) -> float:
    """Calcula a tendência percentual entre dois valores."""
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def _resolve_period_with_previous_calc(
    from_: str = None, to_: str = None, month: str = None
):
    """Resolve período atual e anterior para cálculo de trends."""
    from datetime import datetime
    from dateutil.relativedelta import relativedelta

    if month:
        # Formato: YYYY-MM
        year, month_num = month.split('-')
        start_date = datetime(int(year), int(month_num), 1)
        if int(month_num) == 12:
            end_date = datetime(int(year) + 1, 1, 1)
        else:
            end_date = datetime(int(year), int(month_num) + 1, 1)

        # Período anterior (mês anterior)
        prev_start = start_date - relativedelta(months=1)
        prev_end = start_date

    elif from_ and to_:
        start_date = datetime.fromisoformat(from_)
        end_date = datetime.fromisoformat(to_)

        # Calcular duração do período
        duration = end_date - start_date
        prev_end = start_date
        prev_start = start_date - duration

    else:
        # Padrão: mês atual
        now = now_brt()
        start_date = now.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        if now.month == 12:
            end_date = now.replace(
                year=now.year + 1,
                month=1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0
            )
        else:
            end_date = now.replace(
                month=now.month + 1,
                day=1,
                hour=0,
                minute=0,
                second=0,
                microsecond=0
            )

        # Período anterior (mês anterior)
        prev_start = start_date - relativedelta(months=1)
        prev_end = start_date

    return start_date, end_date, prev_start, prev_end


def _get_calculation_kpis_for_period(start_date, end_date):
    """Calcula KPIs do calculista para um período específico."""
    with SessionLocal() as db:
        from sqlalchemy import and_

        # 1. Simulações pendentes (status = draft)
        pending = db.query(Simulation).filter(
            Simulation.status == "draft"
        ).count()

        # 2. Simulações aprovadas no período
        approved_today = db.query(Simulation).filter(
            and_(
                Simulation.status == "approved",
                Simulation.updated_at >= start_date,
                Simulation.updated_at < end_date
            )
        ).count()

        # 3. Simulações rejeitadas no período
        rejected_today = db.query(Simulation).filter(
            and_(
                Simulation.status == "rejected",
                Simulation.updated_at >= start_date,
                Simulation.updated_at < end_date
            )
        ).count()

        # 4. Total processado no período
        total_today = approved_today + rejected_today

        # 5. Taxa de aprovação
        approval_rate = (
            (approved_today / total_today * 100) if total_today > 0 else 0
        )

        # 6. Volume financeiro das simulações aprovadas no período
        approved_sims = db.query(Simulation).filter(
            and_(
                Simulation.status == "approved",
                Simulation.updated_at >= start_date,
                Simulation.updated_at < end_date
            )
        ).all()

        # Calcular volume financeiro total (soma dos valores de
        # consultoria líquida)
        volume_today = 0
        for sim in approved_sims:
            if sim.custo_consultoria_liquido:
                volume_today += float(sim.custo_consultoria_liquido)

        return {
            "pending": pending,
            "approvedToday": approved_today,
            "rejectedToday": rejected_today,
            "totalToday": total_today,
            "approvalRate": round(approval_rate, 1),
            "volumeToday": volume_today
        }


@calculation_router.get("/kpis")
def get_calculation_kpis(
    from_: str = None,
    to_: str = None,
    month: str = None,
    include_trends: bool = True,
    user=Depends(require_roles("admin", "supervisor", "calculista"))
):
    """
    Retorna KPIs do módulo de cálculo baseados em dados reais das simulações.
    """
    if include_trends:
        # Calcular período atual e anterior
        start_date, end_date, prev_start, prev_end = (
            _resolve_period_with_previous_calc(from_, to_, month)
        )

        # Obter KPIs para ambos os períodos
        current_kpis = _get_calculation_kpis_for_period(start_date, end_date)
        previous_kpis = _get_calculation_kpis_for_period(prev_start, prev_end)

        # Calcular trends
        trends = {
            "pending": _calculate_trend(
                current_kpis["pending"], previous_kpis["pending"]
            ),
            "approvedToday": _calculate_trend(
                current_kpis["approvedToday"], previous_kpis["approvedToday"]
            ),
            "rejectedToday": _calculate_trend(
                current_kpis["rejectedToday"], previous_kpis["rejectedToday"]
            ),
            "totalToday": _calculate_trend(
                current_kpis["totalToday"], previous_kpis["totalToday"]
            ),
            "approvalRate": _calculate_trend(
                current_kpis["approvalRate"], previous_kpis["approvalRate"]
            ),
            "volumeToday": _calculate_trend(
                current_kpis["volumeToday"], previous_kpis["volumeToday"]
            )
        }

        # Adicionar trends aos KPIs atuais
        result = current_kpis.copy()
        result["trends"] = trends
        result["previous_period"] = previous_kpis
        result["period"] = {
            "from": start_date.isoformat(),
            "to": end_date.isoformat(),
            "prev_from": prev_start.isoformat(),
            "prev_to": prev_end.isoformat()
        }

        return result
    else:
        # Modo legado sem trends

        # Determinar período de análise
        if month:
            # Formato: YYYY-MM
            year, month_num = month.split('-')
            start_date = datetime(int(year), int(month_num), 1)
            if int(month_num) == 12:
                end_date = datetime(int(year) + 1, 1, 1)
            else:
                end_date = datetime(int(year), int(month_num) + 1, 1)
        elif from_ and to_:
            start_date = datetime.fromisoformat(from_)
            end_date = datetime.fromisoformat(to_)
        else:
            # Padrão: mês atual
            now = now_brt()
            start_date = now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            if now.month == 12:
                end_date = now.replace(
                    year=now.year + 1,
                    month=1,
                    day=1,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0
                )
            else:
                end_date = now.replace(
                    month=now.month + 1,
                    day=1,
                    hour=0,
                    minute=0,
                    second=0,
                    microsecond=0
                )

        result = _get_calculation_kpis_for_period(start_date, end_date)
        result["period"] = {
            "from": start_date.isoformat(),
            "to": end_date.isoformat()
        }

        return result
