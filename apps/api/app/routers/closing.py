from fastapi import (  # pyright: ignore[reportMissingImports]
    APIRouter, Depends, HTTPException
)
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import joinedload  # pyright: ignore[reportMissingImports]
from ..db import SessionLocal
from ..models import Case, CaseEvent, now_brt
from ..rbac import require_roles
from ..events import eventbus

r = APIRouter(prefix="/closing", tags=["closing"])


@r.get("/queue")
def queue(
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):
    from ..models import Simulation
    with SessionLocal() as db:
        # Query base com JOIN para carregar dados completos
        # Status enviados para fechamento pelo atendente
        query = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status.in_([
            "fechamento_pendente", "fechamento_aprovado",
            "fechamento_reprovado"
        ]))

        # Aplicar filtro de busca se fornecido
        if search:
            from sqlalchemy import or_  # pyright: ignore[reportMissingImports]
            from ..models import Client
            search_term = f"%{search}%"
            query = query.join(Client).filter(
                or_(
                    Client.name.ilike(search_term),
                    Client.cpf.ilike(search_term),
                    Client.matricula.ilike(search_term)
                )
            )

        # Contar total de resultados
        total_count = query.count()

        # Aplicar paginação
        offset = (page - 1) * page_size
        rows = query.order_by(Case.id.desc()).offset(offset).limit(
            page_size
        ).all()

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
                                "valorParcelaTotal": float(
                                    sim.valor_parcela_total or 0
                                ),
                                "saldoTotal": float(
                                    sim.saldo_total or 0
                                ),
                                "liberadoTotal": float(
                                    sim.liberado_total or 0
                                ),
                                "seguroObrigatorio": float(sim.seguro or 0),
                                "totalFinanciado": float(
                                    sim.total_financiado or 0
                                ),
                                "valorLiquido": float(sim.valor_liquido or 0),
                                "custoConsultoria": float(
                                    sim.custo_consultoria or 0
                                ),
                                "liberadoCliente": float(
                                    sim.liberado_cliente or 0
                                )
                            },
                            "banks": sim.banks_json,
                            "prazo": sim.prazo,
                            "percentualConsultoria": float(
                                sim.percentual_consultoria or 0
                            )
                        }

                # Estrutura compatível com CardFechamento
                item = {
                    "id": c.id,
                    "status": c.status,
                    "client": {
                        "name": (
                            c.client.name
                            if c.client
                            else "Cliente não encontrado"
                        ),
                        "cpf": c.client.cpf if c.client else "",
                        "matricula": c.client.matricula if c.client else "",
                        "orgao": (
                            getattr(c.client, 'orgao', None)
                            if c.client
                            else None
                        )
                    },
                    "created_at": (
                        c.last_update_at.isoformat()
                        if c.last_update_at
                        else now_brt().isoformat()
                    ),
                    "last_update_at": (
                        c.last_update_at.isoformat()
                        if c.last_update_at
                        else None
                    ),
                    "banco": getattr(c, 'banco', None),
                    "simulation": simulation_data,
                    "contract": None  # TODO: adicionar se necessário
                }
                items.append(item)
            except Exception as e:
                # Log do erro mas continua processando outros casos
                print(
                    f"Erro ao processar caso {c.id} para fechamento: {e}"
                )
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
                    "created_at": now_brt().isoformat(),
                    "last_update_at": None,
                    "banco": None,
                    "simulation": None,
                    "contract": None
                })

        return {
            "items": items,
            "total_count": total_count,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_count + page_size - 1) // page_size
        }


class CloseIn(BaseModel):
    case_id: int
    notes: str | None = None


@r.post("/approve")
async def approve(
    data: CloseIn,
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):

    pass

    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        # Fechamento aprovado: marca caso como 'fechamento_aprovado'
        # Casos neste status aparecem para revisão final do calculista
        c.status = "fechamento_aprovado"
        c.last_update_at = now_brt()
        db.add(CaseEvent(
            case_id=c.id,
            type="closing.approved",
            payload={"notes": data.notes},
            created_by=user.id
        ))
        db.commit()

    await eventbus.broadcast(
        "case.updated",
        {"case_id": data.case_id, "status": "fechamento_aprovado"}
    )
    return {"ok": True}


@r.post("/reject")
async def reject(
    data: CloseIn,
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):

    pass

    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")
        c.status = "fechamento_reprovado"
        c.last_update_at = now_brt()
        db.add(CaseEvent(
            case_id=c.id,
            type="closing.rejected",
            payload={"notes": data.notes},
            created_by=user.id
        ))
        db.commit()

    await eventbus.broadcast(
        "case.updated",
        {"case_id": data.case_id, "status": "fechamento_reprovado"}
    )
    return {"ok": True}


@r.get("/case/{case_id}")
def get_case_details(
    case_id: int,
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):
    """Retorna detalhes completos de um caso para exibição no modal de
    fechamento"""
    from ..models import Simulation, Attachment, Contract, ContractAttachment
    import os

    with SessionLocal() as db:
        # Buscar o caso com relacionamentos
        case = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.id == case_id).first()

        if not case:
            raise HTTPException(404, "Case not found")

        # Dados do cliente
        client_data = {
            "id": case.client.id,
            "name": case.client.name,
            "cpf": case.client.cpf,
            "matricula": case.client.matricula,
            "orgao": case.client.orgao,
            "telefone_preferencial": case.client.telefone_preferencial,
            "numero_cliente": case.client.numero_cliente,
            "observacoes": case.client.observacoes,
            "banco": case.client.banco,
            "agencia": case.client.agencia,
            "conta": case.client.conta,
            "chave_pix": case.client.chave_pix,
            "tipo_chave_pix": case.client.tipo_chave_pix
        }

        # Simulação aprovada
        simulation_data = None
        if case.last_simulation_id:
            sim = db.get(Simulation, case.last_simulation_id)
            if sim and sim.status == "approved":
                simulation_data = {
                    "id": sim.id,
                    "status": sim.status,
                    "prazo": sim.prazo,
                    "coeficiente": sim.coeficiente,
                    "seguro": float(sim.seguro or 0),
                    "percentual_consultoria": float(
                        sim.percentual_consultoria or 0
                    ),
                    "banks_json": sim.banks_json,
                    "totals": {
                        "valorParcelaTotal": float(
                            sim.valor_parcela_total or 0
                        ),
                        "saldoTotal": float(sim.saldo_total or 0),
                        "liberadoTotal": float(sim.liberado_total or 0),
                        "totalFinanciado": float(sim.total_financiado or 0),
                        "valorLiquido": float(sim.valor_liquido or 0),
                        "custoConsultoria": float(sim.custo_consultoria or 0),
                        "custoConsultoriaLiquido": float(
                            sim.custo_consultoria_liquido or 0
                        ),
                        "liberadoCliente": float(sim.liberado_cliente or 0)
                    }
                }

        # Contrato efetivado (se existir)
        contract_data = None
        contract = db.query(Contract).filter(
            Contract.case_id == case.id
        ).first()
        if contract:
            attachments = db.query(ContractAttachment).filter(
                ContractAttachment.contract_id == contract.id
            ).all()
            contract_data = {
                "id": contract.id,
                "total_amount": float(contract.total_amount or 0),
                "installments": contract.installments,
                "disbursed_at": (
                    contract.disbursed_at.isoformat()
                    if contract.disbursed_at
                    else None
                ),
                "status": contract.status,
                "attachments": [
                    {
                        "id": a.id,
                        "filename": a.filename,
                        "size": a.size,
                        "mime": a.mime,
                        "created_at": (
                            a.created_at.isoformat()
                            if a.created_at
                            else None
                        )
                    } for a in attachments
                ]
            }

        # Eventos do caso (histórico/comentários)
        events = db.query(CaseEvent).filter(
            CaseEvent.case_id == case.id
        ).order_by(CaseEvent.created_at.desc()).all()

        events_data = [
            {
                "id": e.id,
                "type": e.type,
                "created_at": (
                    e.created_at.isoformat() if e.created_at else None
                ),
                "payload": e.payload,
                "created_by": e.created_by
            } for e in events
        ]

        # Anexos do caso
        attachments = db.query(Attachment).filter(
            Attachment.case_id == case.id
        ).all()

        attachments_data = [
            {
                "id": a.id,
                "path": a.path,
                "filename": (
                    os.path.basename(a.path) if a.path else None
                ),
                "mime": a.mime,
                "size": a.size,
                "created_at": (
                    a.created_at.isoformat() if a.created_at else None
                )
            } for a in attachments
        ]

        return {
            "id": case.id,
            "status": case.status,
            "created_at": (
                case.created_at.isoformat() if case.created_at else None
            ),
            "client": client_data,
            "simulation": simulation_data,
            "contract": contract_data,
            "events": events_data,
            "attachments": attachments_data
        }


@r.get("/kpis")
def closing_kpis(
    from_date: str | None = None,
    to_date: str | None = None,
    month: str | None = None,
    user=Depends(require_roles(
        "admin", "supervisor", "fechamento", "atendente"
    ))
):
    """Retorna KPIs do módulo de fechamento com dados reais e
    porcentagens calculadas"""
    from ..models import Contract
    from datetime import datetime, timedelta
    from sqlalchemy import func, and_  # pyright: ignore[reportMissingImports]

    def _parse_period(from_date, to_date, month):
        """Parse período atual e anterior para comparação"""
        if month:
            # Se month for fornecido (formato YYYY-MM), usar o mês específico
            try:
                year, month_num = month.split('-')
                start_date = datetime(int(year), int(month_num), 1)
                if int(month_num) == 12:
                    end_date = datetime(int(year) + 1, 1, 1)
                else:
                    end_date = datetime(int(year), int(month_num) + 1, 1)
            except Exception:
                # Fallback para mês atual
                now = datetime.utcnow()
                start_date = datetime(now.year, now.month, 1)
                if now.month == 12:
                    end_date = datetime(now.year + 1, 1, 1)
                else:
                    end_date = datetime(now.year, now.month + 1, 1)
        elif from_date and to_date:
            try:
                start_date = datetime.fromisoformat(from_date)
                end_date = datetime.fromisoformat(to_date)
            except Exception:
                # Fallback para mês atual
                now = datetime.utcnow()
                start_date = datetime(now.year, now.month, 1)
                if now.month == 12:
                    end_date = datetime(now.year + 1, 1, 1)
                else:
                    end_date = datetime(now.year, now.month + 1, 1)
        else:
            # Padrão: mês atual
            now = datetime.utcnow()
            start_date = datetime(now.year, now.month, 1)
            if now.month == 12:
                end_date = datetime(now.year + 1, 1, 1)
            else:
                end_date = datetime(now.year, now.month + 1, 1)

        # Calcular período anterior de mesma duração
        period_span = (end_date - start_date).days
        prev_start_date = start_date - timedelta(days=period_span)
        prev_end_date = start_date - timedelta(days=1)

        return start_date, end_date, prev_start_date, prev_end_date

    def _calculate_trend(current_value, previous_value):
        """Calcula a porcentagem de mudança entre períodos"""
        if previous_value == 0:
            return 100.0 if current_value > 0 else 0.0
        return round(
            ((current_value - previous_value) / previous_value) * 100, 1
        )

    with SessionLocal() as db:
        start_date, end_date, prev_start_date, prev_end_date = _parse_period(
            from_date, to_date, month
        )

        # Casos pendentes de fechamento (sempre atual, não depende de período)
        casos_pendentes = db.query(func.count(Case.id)).filter(
            Case.status.in_(["calculo_aprovado", "fechamento_pendente"])
        ).scalar() or 0

        # PERÍODO ATUAL
        # Casos aprovados no período atual
        casos_aprovados = db.query(func.count(Case.id)).filter(
            and_(
                Case.status == "fechamento_aprovado",
                Case.last_update_at >= start_date,
                Case.last_update_at < end_date
            )
        ).scalar() or 0

        # Casos reprovados no período atual
        casos_reprovados = db.query(func.count(Case.id)).filter(
            and_(
                Case.status == "fechamento_reprovado",
                Case.last_update_at >= start_date,
                Case.last_update_at < end_date
            )
        ).scalar() or 0

        # Total de casos processados no período atual
        total_processados = casos_aprovados + casos_reprovados

        # Taxa de aprovação atual
        taxa_aprovacao = (
            (casos_aprovados / total_processados * 100)
            if total_processados > 0
            else 0
        )

        # Volume financeiro dos contratos efetivados no período atual
        volume_financeiro = db.query(
            func.coalesce(func.sum(Contract.total_amount), 0)
        ).filter(
            and_(
                Contract.status == "ativo",
                Contract.signed_at >= start_date,
                Contract.signed_at < end_date
            )
        ).scalar() or 0

        # Consultoria líquida no período atual (CORRIGIDO: usar FinanceIncome)
        from ..models import FinanceIncome
        consultoria_liquida = db.query(
            func.coalesce(func.sum(FinanceIncome.amount), 0)
        ).filter(
            and_(
                FinanceIncome.date >= start_date,
                FinanceIncome.date < end_date,
                FinanceIncome.income_type.in_([
                    "Consultoria Líquida",
                    "Consultoria Líquida - Atendente",
                    "Consultoria Líquida - Balcão"
                ])
            )
        ).scalar() or 0

        # PERÍODO ANTERIOR
        # Casos aprovados no período anterior
        casos_aprovados_prev = db.query(func.count(Case.id)).filter(
            and_(
                Case.status == "fechamento_aprovado",
                Case.last_update_at >= prev_start_date,
                Case.last_update_at < prev_end_date
            )
        ).scalar() or 0

        # Casos reprovados no período anterior
        casos_reprovados_prev = db.query(func.count(Case.id)).filter(
            and_(
                Case.status == "fechamento_reprovado",
                Case.last_update_at >= prev_start_date,
                Case.last_update_at < prev_end_date
            )
        ).scalar() or 0

        # Total de casos processados no período anterior
        total_processados_prev = casos_aprovados_prev + casos_reprovados_prev

        # Taxa de aprovação anterior
        taxa_aprovacao_prev = (
            (casos_aprovados_prev / total_processados_prev * 100)
            if total_processados_prev > 0
            else 0
        )

        # Volume financeiro no período anterior
        volume_financeiro_prev = db.query(
            func.coalesce(func.sum(Contract.total_amount), 0)
        ).filter(
            and_(
                Contract.status == "ativo",
                Contract.signed_at >= prev_start_date,
                Contract.signed_at < prev_end_date
            )
        ).scalar() or 0

        # Consultoria líquida no período anterior
        # (CORRIGIDO: usar FinanceIncome)
        consultoria_liquida_prev = db.query(
            func.coalesce(func.sum(FinanceIncome.amount), 0)
        ).filter(
            and_(
                FinanceIncome.date >= prev_start_date,
                FinanceIncome.date < prev_end_date,
                FinanceIncome.income_type.in_([
                    "Consultoria Líquida",
                    "Consultoria Líquida - Atendente",
                    "Consultoria Líquida - Balcão"
                ])
            )
        ).scalar() or 0

        # Contratos efetivados hoje
        hoje = datetime.utcnow().date()
        contratos_hoje = db.query(func.count(Contract.id)).filter(
            and_(
                Contract.status == "ativo",
                func.date(Contract.signed_at) == hoje
            )
        ).scalar() or 0

        # Calcular despesas do período
        from ..models import FinanceExpense
        despesas = db.query(
            func.coalesce(func.sum(FinanceExpense.amount), 0)
        ).filter(
            and_(
                FinanceExpense.date >= start_date,
                FinanceExpense.date < end_date
            )
        ).scalar() or 0

        # Calcular despesas do período anterior
        despesas_prev = db.query(
            func.coalesce(func.sum(FinanceExpense.amount), 0)
        ).filter(
            and_(
                FinanceExpense.date >= prev_start_date,
                FinanceExpense.date < prev_end_date
            )
        ).scalar() or 0

        # Calcular Lucro Líquido: Consultoria Líquida - Despesas
        lucro_liquido = (
            float(consultoria_liquida) - float(despesas)
        )
        lucro_liquido_prev = (
            float(consultoria_liquida_prev) - float(despesas_prev)
        )
        
        # Resultado Thiago/Francisco = (10% do Lucro Líquido) - Receitas Peltson
        # PODE SER NEGATIVO - isto é esperado e correto!
        from ..models import User
        peltson = db.query(User).filter(
            User.email == "peltson@gmail.com"
        ).first()

        receitas_peltson = 0
        if peltson:
            receitas_peltson = db.query(
                func.coalesce(func.sum(FinanceIncome.amount), 0)
            ).filter(
                FinanceIncome.agent_user_id == peltson.id,
                FinanceIncome.income_type == (
                    "Consultoria Líquida - Atendente"
                ),
                FinanceIncome.date >= start_date,
                FinanceIncome.date < end_date
            ).scalar() or 0

        receitas_peltson_prev = 0
        if peltson:
            receitas_peltson_prev = db.query(
                func.coalesce(func.sum(FinanceIncome.amount), 0)
            ).filter(
                FinanceIncome.agent_user_id == peltson.id,
                FinanceIncome.income_type == (
                    "Consultoria Líquida - Atendente"
                ),
                FinanceIncome.date >= prev_start_date,
                FinanceIncome.date < prev_end_date
            ).scalar() or 0

        # Fórmula: 10% × (Lucro Líquido - Receitas Peltson)
        # O que sobra após Peltson é a produção de Thiago/Francisco
        meta_mensal = (lucro_liquido - float(receitas_peltson)) * 0.10
        meta_mensal_prev = (lucro_liquido_prev - float(receitas_peltson_prev)) * 0.10

        return {
            "casos_pendentes": casos_pendentes,
            "casos_aprovados": casos_aprovados,
            "casos_reprovados": casos_reprovados,
            "total_processados": total_processados,
            "taxa_aprovacao": round(taxa_aprovacao, 2),
            "volume_financeiro": float(volume_financeiro),
            "consultoria_liquida": float(consultoria_liquida),
            "despesas": float(despesas),
            "meta_mensal": round(meta_mensal, 2),
            "contratos_efetivados_hoje": contratos_hoje,
            # Trends calculados automaticamente
            "trends": {
                "casos_pendentes": 0,  # Casos pendentes não têm trend
                "casos_aprovados": _calculate_trend(
                    casos_aprovados, casos_aprovados_prev
                ),
                "taxa_aprovacao": _calculate_trend(
                    taxa_aprovacao, taxa_aprovacao_prev
                ),
                "volume_financeiro": _calculate_trend(
                    volume_financeiro, volume_financeiro_prev
                ),
                "consultoria_liquida": _calculate_trend(
                    consultoria_liquida, consultoria_liquida_prev
                ),
                "despesas": _calculate_trend(
                    despesas, despesas_prev
                ),
                "meta_mensal": _calculate_trend(
                    meta_mensal, meta_mensal_prev
                )
            },
            "periodo": {
                "inicio": start_date.isoformat(),
                "fim": end_date.isoformat()
            },
            "periodo_anterior": {
                "inicio": prev_start_date.isoformat(),
                "fim": prev_end_date.isoformat()
            }
        }
