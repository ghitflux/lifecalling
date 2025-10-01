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
    from sqlalchemy.orm import joinedload
    from ..models import Simulation
    with SessionLocal() as db:
        rows = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status=="fechamento_aprovado").order_by(Case.id.desc()).all()

        items = []
        for c in rows:
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

            item = {
                "id": c.id,
                "client_id": c.client_id,
                "status": c.status,
                "client": {
                    "id": c.client.id,
                    "name": c.client.name,
                    "cpf": c.client.cpf,
                    "matricula": c.client.matricula,
                    "banco": c.client.banco,
                    "agencia": c.client.agencia,
                    "conta": c.client.conta,
                    "chave_pix": c.client.chave_pix,
                    "tipo_chave_pix": c.client.tipo_chave_pix
                },
                "simulation": simulation_data
            }

            # Buscar contrato se existir para incluir anexos
            contract = db.query(Contract).filter(Contract.case_id == c.id).first()
            if contract:
                from ..models import ContractAttachment
                attachments = db.query(ContractAttachment).filter(
                    ContractAttachment.contract_id == contract.id
                ).all()
                item["contract"] = {
                    "id": contract.id,
                    "total_amount": float(contract.total_amount) if contract.total_amount else 0,
                    "installments": contract.installments,
                    "attachments": [
                        {
                            "id": a.id,
                            "filename": a.filename,
                            "size": a.size,
                            "uploaded_at": a.created_at.isoformat() if a.created_at else None
                        } for a in attachments
                    ]
                }
            else:
                item["contract"] = None

            items.append(item)

        return {"items": items}

@r.get("/metrics")
def finance_metrics(user=Depends(require_roles("admin","supervisor","financeiro"))):
    from ..models import Contract, Payment, Simulation
    from sqlalchemy import func
    from datetime import datetime, timedelta

    with SessionLocal() as db:
        # Total de casos pendentes
        pending_count = db.query(Case).filter(Case.status == "fechamento_aprovado").count()

        # Total de contratos efetivados
        total_contracts = db.query(Contract).count()

        # Volume total financiado (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        total_volume = db.query(func.sum(Contract.total_amount)).filter(
            Contract.created_at >= thirty_days_ago
        ).scalar() or 0

        # Ticket médio
        avg_ticket = db.query(func.avg(Contract.total_amount)).scalar() or 0

        # Contratos em atraso (mock por enquanto)
        overdue_count = 2

        # Meta mensal (mock)
        monthly_target = 3000000

        # Taxa de aprovação (aproximada)
        approved_cases = db.query(Case).filter(Case.status.in_(["fechamento_aprovado", "contrato_efetivado"])).count()
        total_cases = db.query(Case).count()
        approval_rate = (approved_cases / total_cases * 100) if total_cases > 0 else 0

        # NOVOS CÁLCULOS: Impostos e Receitas
        # Buscar todas as simulações aprovadas dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        approved_simulations = db.query(Simulation).join(Case).filter(
            Simulation.status == "approved",
            Simulation.updated_at >= thirty_days_ago
        ).all()

        # Calcular total de consultoria
        total_consultoria = sum([float(sim.custo_consultoria or 0) for sim in approved_simulations])

        # Imposto: 14% da consultoria
        total_tax = total_consultoria * 0.14

        # Consultoria líquida (86% = 100% - 14%)
        total_consultoria_liquida = total_consultoria * 0.86

        # Receitas = consultoria líquida
        total_revenue = total_consultoria_liquida

        # Buscar despesas do mês atual
        from ..models import FinanceExpense
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year

        expense_record = db.query(FinanceExpense).filter(
            FinanceExpense.month == current_month,
            FinanceExpense.year == current_year
        ).first()

        total_expenses = float(expense_record.amount) if expense_record else 0

        # Lucro líquido = Receitas - Despesas - Impostos
        net_profit = total_revenue - total_expenses - total_tax

        return {
            "totalVolume": float(total_volume),
            "monthlyTarget": monthly_target,
            "approvalRate": round(approval_rate, 1),
            "pendingCount": pending_count,
            "overdueCount": overdue_count,
            "averageTicket": float(avg_ticket),
            "totalContracts": total_contracts,
            "totalTax": round(total_tax, 2),
            "totalExpenses": round(total_expenses, 2),
            "totalRevenue": round(total_revenue, 2),
            "netProfit": round(net_profit, 2)
        }

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

class DisburseSimpleIn(BaseModel):
    case_id: int
    disbursed_at: datetime | None = None

@r.post("/disburse-simple")
async def disburse_simple(data: DisburseSimpleIn, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Efetiva liberação usando os valores já calculados da simulação"""
    with SessionLocal() as db:
        c = db.get(Case, data.case_id)
        if not c:
            raise HTTPException(404, "case not found")

        # Busca a simulação mais recente
        from ..models import Simulation
        simulation = db.query(Simulation).filter(
            Simulation.case_id == c.id
        ).order_by(Simulation.id.desc()).first()

        if not simulation:
            raise HTTPException(400, "No simulation found for this case")

        ct = db.query(Contract).filter(Contract.case_id==c.id).first()
        if not ct:
            ct = Contract(case_id=c.id)

        # Usa os valores da simulação
        ct.total_amount = simulation.valor_liberado
        ct.installments = simulation.prazo
        ct.disbursed_at = data.disbursed_at or datetime.utcnow()
        ct.updated_at = datetime.utcnow()
        db.add(ct)

        c.status = "contrato_efetivado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="finance.disbursed",
                         payload={"contract_id": None, "amount": float(simulation.valor_liberado), "installments": simulation.prazo},
                         created_by=user.id))
        db.commit()
        db.refresh(ct)

    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"contrato_efetivado"})
    return {"contract_id": ct.id}

@r.post("/cancel/{contract_id}")
async def cancel_contract(contract_id: int, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Cancela um contrato efetivado"""
    with SessionLocal() as db:
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "contract not found")

        case = db.get(Case, contract.case_id)
        if not case:
            raise HTTPException(404, "case not found")

        # Verifica se pode ser cancelado
        if case.status != "contrato_efetivado":
            raise HTTPException(400, "contract cannot be cancelled in current status")

        # Atualiza status para cancelado
        case.status = "contrato_cancelado"
        case.last_update_at = datetime.utcnow()

        # Adiciona evento de cancelamento
        db.add(CaseEvent(
            case_id=case.id,
            type="finance.cancelled",
            payload={"contract_id": contract.id, "cancelled_by": user.id},
            created_by=user.id
        ))

        db.commit()

    await eventbus.broadcast("case.updated", {"case_id": case.id, "status": "contrato_cancelado"})
    return {"success": True, "message": "Contract cancelled successfully"}

@r.delete("/delete/{contract_id}")
async def delete_contract(contract_id: int, user=Depends(require_roles("admin","supervisor"))):
    """Deleta permanentemente um contrato e todos os dados relacionados"""
    with SessionLocal() as db:
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "contract not found")

        case = db.get(Case, contract.case_id)
        if not case:
            raise HTTPException(404, "case not found")

        # Remove anexos do contrato
        from ..models import ContractAttachment
        attachments = db.query(ContractAttachment).filter(
            ContractAttachment.contract_id == contract.id
        ).all()

        for attachment in attachments:
            # TODO: Remover arquivo físico do storage
            db.delete(attachment)

        # Remove eventos relacionados ao contrato
        events = db.query(CaseEvent).filter(
            CaseEvent.case_id == case.id,
            CaseEvent.type.in_(["finance.disbursed", "finance.cancelled"])
        ).all()

        for event in events:
            db.delete(event)

        # Remove o contrato
        db.delete(contract)

        # Volta o caso para status anterior
        case.status = "fechamento_aprovado"
        case.last_update_at = datetime.utcnow()

        # Adiciona evento de deleção
        db.add(CaseEvent(
            case_id=case.id,
            type="finance.deleted",
            payload={"deleted_contract_id": contract_id, "deleted_by": user.id},
            created_by=user.id
        ))

        db.commit()

    await eventbus.broadcast("case.updated", {"case_id": case.id, "status": "fechamento_aprovado"})
    return {"success": True, "message": "Contract deleted successfully"}

# Gestão de Despesas Mensais

class ExpenseInput(BaseModel):
    month: int  # 1-12
    year: int  # 2024, 2025, etc
    amount: float
    description: str | None = None

@r.get("/expenses")
def list_expenses(user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Lista todas as despesas mensais"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expenses = db.query(FinanceExpense).order_by(
            FinanceExpense.year.desc(),
            FinanceExpense.month.desc()
        ).all()

        return {
            "items": [
                {
                    "id": exp.id,
                    "month": exp.month,
                    "year": exp.year,
                    "amount": float(exp.amount),
                    "description": exp.description,
                    "created_at": exp.created_at.isoformat() if exp.created_at else None
                }
                for exp in expenses
            ]
        }

@r.get("/expenses/{month}/{year}")
def get_expense(
    month: int,
    year: int,
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    """Obtém despesa de um mês específico"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expense = db.query(FinanceExpense).filter(
            FinanceExpense.month == month,
            FinanceExpense.year == year
        ).first()

        if not expense:
            return {"expense": None}

        return {
            "expense": {
                "id": expense.id,
                "month": expense.month,
                "year": expense.year,
                "amount": float(expense.amount),
                "description": expense.description,
                "created_at": expense.created_at.isoformat() if expense.created_at else None
            }
        }

@r.post("/expenses")
def create_or_update_expense(data: ExpenseInput, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Cria ou atualiza despesa de um mês"""
    with SessionLocal() as db:
        from ..models import FinanceExpense

        # Validações
        if data.month < 1 or data.month > 12:
            raise HTTPException(400, "Mês deve estar entre 1 e 12")

        if data.amount < 0:
            raise HTTPException(400, "Valor não pode ser negativo")

        # Verificar se já existe
        expense = db.query(FinanceExpense).filter(
            FinanceExpense.month == data.month,
            FinanceExpense.year == data.year
        ).first()

        if expense:
            # Atualizar
            expense.amount = data.amount
            expense.description = data.description
            expense.updated_at = datetime.utcnow()
        else:
            # Criar
            expense = FinanceExpense(
                month=data.month,
                year=data.year,
                amount=data.amount,
                description=data.description,
                created_by=user.id
            )
            db.add(expense)

        db.commit()
        db.refresh(expense)

        return {
            "id": expense.id,
            "month": expense.month,
            "year": expense.year,
            "amount": float(expense.amount),
            "description": expense.description
        }

@r.delete("/expenses/{month}/{year}")
def delete_expense(
    month: int,
    year: int,
    user=Depends(require_roles("admin","supervisor"))
):
    """Remove despesa de um mês"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expense = db.query(FinanceExpense).filter(
            FinanceExpense.month == month,
            FinanceExpense.year == year
        ).first()

        if not expense:
            raise HTTPException(404, "Despesa não encontrada")

        db.delete(expense)
        db.commit()

        return {"message": "Despesa removida com sucesso"}
