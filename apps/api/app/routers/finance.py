from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from datetime import datetime
from ..db import SessionLocal
from ..models import Case, CaseEvent, Contract
from ..rbac import require_roles
from ..events import eventbus
import io
import csv
import os

r = APIRouter(prefix="/finance", tags=["finance"])

@r.get("/queue")
def queue(user=Depends(require_roles("admin","supervisor","financeiro"))):
    from sqlalchemy.orm import joinedload
    from ..models import Simulation, Attachment, ContractAttachment
    with SessionLocal() as db:
        rows = db.query(Case).options(
            joinedload(Case.client),
            joinedload(Case.last_simulation)
        ).filter(Case.status == "financeiro_pendente").order_by(Case.id.desc()).all()

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
                contract_attachments = db.query(ContractAttachment).filter(
                    ContractAttachment.contract_id == contract.id
                ).all()
                item["contract"] = {
                    "id": contract.id,
                    "total_amount": float(contract.total_amount) if contract.total_amount else 0,
                    "installments": contract.installments,
                    "disbursed_at": contract.disbursed_at.isoformat() if contract.disbursed_at else None,
                    "status": contract.status,
                    "attachments": [
                        {
                            "id": a.id,
                            "filename": a.filename,
                            "size": a.size,
                            "mime": a.mime,
                            "mime_type": a.mime,
                            "uploaded_at": a.created_at.isoformat() if a.created_at else None
                        } for a in contract_attachments
                    ]
                }
            else:
                item["contract"] = None

            case_attachments = db.query(Attachment).filter(
                Attachment.case_id == c.id
            ).order_by(Attachment.created_at.desc()).all()
            item["attachments"] = [
                {
                    "id": att.id,
                    "filename": os.path.basename(att.path),
                    "size": att.size,
                    "mime": att.mime,
                    "mime_type": att.mime,
                    "uploaded_at": att.created_at.isoformat() if att.created_at else None
                }
                for att in case_attachments
            ]

            items.append(item)

        return {"items": items}

@r.get("/case/{case_id}")
def get_case_details(case_id: int, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Retorna detalhes completos de um caso para exibição no modal financeiro"""
    from sqlalchemy.orm import joinedload
    from ..models import Simulation, Attachment, Client

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
                    "percentual_consultoria": float(sim.percentual_consultoria or 0),
                    "banks_json": sim.banks_json,
                    "totals": {
                        "valorParcelaTotal": float(sim.valor_parcela_total or 0),
                        "saldoTotal": float(sim.saldo_total or 0),
                        "liberadoTotal": float(sim.liberado_total or 0),
                        "totalFinanciado": float(sim.total_financiado or 0),
                        "valorLiquido": float(sim.valor_liquido or 0),
                        "custoConsultoria": float(sim.custo_consultoria or 0),
                        "custoConsultoriaLiquido": float(sim.custo_consultoria_liquido or 0),
                        "liberadoCliente": float(sim.liberado_cliente or 0)
                    }
                }

        # Contrato efetivado (se existir)
        contract_data = None
        contract = db.query(Contract).filter(Contract.case_id == case.id).first()
        if contract:
            from ..models import ContractAttachment
            attachments = db.query(ContractAttachment).filter(
                ContractAttachment.contract_id == contract.id
            ).all()
            contract_data = {
                "id": contract.id,
                "total_amount": float(contract.total_amount or 0),
                "installments": contract.installments,
                "disbursed_at": contract.disbursed_at.isoformat() if contract.disbursed_at else None,
                "status": contract.status,
                "attachments": [
                    {
                        "id": a.id,
                        "filename": a.filename,
                        "size": a.size,
                        "mime": a.mime,
                        "created_at": a.created_at.isoformat() if a.created_at else None
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
                "created_at": e.created_at.isoformat() if e.created_at else None,
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
                "mime": a.mime,
                "size": a.size,
                "created_at": a.created_at.isoformat() if a.created_at else None
            } for a in attachments
        ]

        return {
            "id": case.id,
            "status": case.status,
            "created_at": case.created_at.isoformat() if case.created_at else None,
            "client": client_data,
            "simulation": simulation_data,
            "contract": contract_data,
            "events": events_data,
            "attachments": attachments_data
        }

@r.get("/metrics")
def finance_metrics(user=Depends(require_roles("admin","supervisor","financeiro"))):
    from ..models import Contract, FinanceIncome, FinanceExpense
    from sqlalchemy import func
    from datetime import datetime, timedelta

    with SessionLocal() as db:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Usar uma única query agregada para contratos
        contract_stats = db.query(
            func.count(Contract.id).label("total_contracts"),
            func.coalesce(func.sum(Contract.consultoria_valor_liquido), 0).label("total_consultoria_liq")
        ).filter(
            Contract.status == "ativo",
            Contract.signed_at >= thirty_days_ago
        ).first()

        total_contracts = contract_stats.total_contracts or 0
        total_consultoria_liquida = float(contract_stats.total_consultoria_liq or 0)

        # Receitas e despesas em queries agregadas
        total_manual_income = float(db.query(
            func.coalesce(func.sum(FinanceIncome.amount), 0)
        ).filter(FinanceIncome.date >= thirty_days_ago).scalar() or 0)

        total_expenses = float(db.query(
            func.coalesce(func.sum(FinanceExpense.amount), 0)
        ).filter(FinanceExpense.date >= thirty_days_ago).scalar() or 0)

        # Receita total = consultoria líquida (já é 86%) + receitas manuais
        total_revenue = total_consultoria_liquida + total_manual_income

        # Impostos: 14% sobre consultoria bruta (consultoria_liq / 0.86 * 0.14)
        total_tax = (total_consultoria_liquida / 0.86 * 0.14) if total_consultoria_liquida > 0 else 0

        # Lucro líquido = Receitas - Despesas - Impostos
        net_profit = total_revenue - total_expenses - total_tax

        return {
            "totalRevenue": round(total_revenue, 2),
            "totalExpenses": round(total_expenses, 2),
            "netProfit": round(net_profit, 2),
            "totalContracts": int(total_contracts),
            "totalTax": round(total_tax, 2),
            "totalManualIncome": round(total_manual_income, 2),
            "totalConsultoriaLiq": round(total_consultoria_liquida, 2)
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

        # Buscar simulação para pegar consultoria líquida
        from ..models import Simulation
        simulation = db.query(Simulation).filter(
            Simulation.case_id == c.id
        ).order_by(Simulation.id.desc()).first()

        consultoria_liquida = simulation.custo_consultoria_liquido if simulation else 0

        ct.total_amount = data.total_amount
        ct.installments = data.installments
        ct.disbursed_at = data.disbursed_at or datetime.utcnow()
        ct.updated_at = datetime.utcnow()

        # Campos de receita e ranking
        ct.consultoria_valor_liquido = consultoria_liquida
        ct.signed_at = data.disbursed_at or datetime.utcnow()
        ct.created_by = user.id
        ct.agent_user_id = c.assigned_user_id  # Atendente do caso

        db.add(ct)
        db.flush()

        # Criar receita automática (Consultoria Líquida 86%)
        if consultoria_liquida and consultoria_liquida > 0:
            from ..models import FinanceIncome
            income = FinanceIncome(
                date=data.disbursed_at or datetime.utcnow(),
                income_type="Consultoria Líquida",
                income_name=f"Contrato #{ct.id} - {c.client.name}",
                amount=consultoria_liquida,
                created_by=user.id
            )
            db.add(income)

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
        total_amount = simulation.liberado_cliente or simulation.liberado_total
        if total_amount is None:
            raise HTTPException(400, "Simulation is missing disbursement totals")

        # Pegar consultoria líquida (86%) da simulação
        consultoria_liquida = simulation.custo_consultoria_liquido or 0

        ct.total_amount = total_amount
        ct.installments = simulation.prazo
        ct.disbursed_at = data.disbursed_at or datetime.utcnow()
        ct.updated_at = datetime.utcnow()
        ct.status = "ativo"

        # Campos de receita e ranking
        ct.consultoria_valor_liquido = consultoria_liquida
        ct.signed_at = data.disbursed_at or datetime.utcnow()
        ct.created_by = user.id
        ct.agent_user_id = c.assigned_user_id  # Atendente do caso

        db.add(ct)
        db.flush()

        # Criar receita automática (Consultoria Líquida 86%)
        if consultoria_liquida and consultoria_liquida > 0:
            from ..models import FinanceIncome
            income = FinanceIncome(
                date=data.disbursed_at or datetime.utcnow(),
                income_type="Consultoria Líquida",
                income_name=f"Contrato #{ct.id} - {c.client.name}",
                amount=consultoria_liquida,
                created_by=user.id
            )
            db.add(income)

        c.status = "contrato_efetivado"
        c.last_update_at = datetime.utcnow()
        db.add(CaseEvent(case_id=c.id, type="finance.disbursed",
                         payload={"contract_id": ct.id, "amount": float(total_amount), "installments": simulation.prazo},
                         created_by=user.id))
        db.commit()
        db.refresh(ct)

    await eventbus.broadcast("case.updated", {"case_id": data.case_id, "status":"contrato_efetivado"})
    return {"contract_id": ct.id}

@r.post("/cancel/{contract_id}")
async def cancel_contract(contract_id: int, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Cancela um contrato efetivado e remove receita associada"""
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

        # Remover receita associada ao contrato (se existir)
        from ..models import FinanceIncome
        income = db.query(FinanceIncome).filter(
            FinanceIncome.income_name.like(f"Contrato #{contract.id} -%")
        ).first()
        if income:
            db.delete(income)

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
    """Deleta permanentemente um contrato, receita associada e todos os dados relacionados"""
    with SessionLocal() as db:
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "contract not found")

        case = db.get(Case, contract.case_id)
        if not case:
            raise HTTPException(404, "case not found")

        # Remover receita associada ao contrato (se existir)
        from ..models import FinanceIncome
        income = db.query(FinanceIncome).filter(
            FinanceIncome.income_name.like(f"Contrato #{contract.id} -%")
        ).first()
        if income:
            db.delete(income)

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

        # Volta o caso para status anterior (financeiro pendente)
        case.status = "financeiro_pendente"
        case.last_update_at = datetime.utcnow()

        # Adiciona evento de deleção
        db.add(CaseEvent(
            case_id=case.id,
            type="finance.deleted",
            payload={"deleted_contract_id": contract_id, "deleted_by": user.id},
            created_by=user.id
        ))

        db.commit()

    await eventbus.broadcast("case.updated", {"case_id": case.id, "status": "financeiro_pendente"})
    return {"success": True, "message": "Contract deleted successfully"}

# Gestão de Despesas Individuais

class ExpenseInput(BaseModel):
    date: str  # "YYYY-MM-DD"
    expense_type: str  # Tipo da despesa
    expense_name: str  # Nome da despesa
    amount: float
    # Mantido para compatibilidade
    month: int | None = None
    year: int | None = None

@r.get("/expenses")
def list_expenses(user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Lista todas as despesas individuais"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expenses = db.query(FinanceExpense).order_by(
            FinanceExpense.date.desc()
        ).all()

        total = sum([float(exp.amount) for exp in expenses])

        return {
            "items": [
                {
                    "id": exp.id,
                    "date": exp.date.isoformat() if exp.date else None,
                    "expense_type": exp.expense_type,
                    "expense_name": exp.expense_name,
                    "amount": float(exp.amount),
                    "created_at": exp.created_at.isoformat() if exp.created_at else None
                }
                for exp in expenses
            ],
            "total": round(total, 2)
        }

@r.get("/expenses/{expense_id}")
def get_expense(
    expense_id: int,
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    """Obtém uma despesa específica"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expense = db.get(FinanceExpense, expense_id)

        if not expense:
            raise HTTPException(404, "Despesa não encontrada")

        return {
            "id": expense.id,
            "date": expense.date.isoformat() if expense.date else None,
            "expense_type": expense.expense_type,
            "expense_name": expense.expense_name,
            "amount": float(expense.amount),
            "created_at": expense.created_at.isoformat() if expense.created_at else None
        }

@r.post("/expenses")
def create_expense(data: ExpenseInput, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Cria uma nova despesa individual"""
    with SessionLocal() as db:
        from ..models import FinanceExpense

        # Validações
        if data.amount < 0:
            raise HTTPException(400, "Valor não pode ser negativo")

        # Parse da data
        try:
            expense_date = datetime.fromisoformat(data.date)
        except:
            raise HTTPException(400, "Data inválida. Use formato YYYY-MM-DD")

        # Criar despesa
        expense = FinanceExpense(
            date=expense_date,
            month=expense_date.month,
            year=expense_date.year,
            expense_type=data.expense_type,
            expense_name=data.expense_name,
            amount=data.amount,
            created_by=user.id
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)

        return {
            "id": expense.id,
            "date": expense.date.isoformat() if expense.date else None,
            "expense_type": expense.expense_type,
            "expense_name": expense.expense_name,
            "amount": float(expense.amount)
        }

@r.put("/expenses/{expense_id}")
def update_expense(expense_id: int, data: ExpenseInput, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Atualiza uma despesa existente"""
    with SessionLocal() as db:
        from ..models import FinanceExpense

        expense = db.get(FinanceExpense, expense_id)
        if not expense:
            raise HTTPException(404, "Despesa não encontrada")

        # Validações
        if data.amount < 0:
            raise HTTPException(400, "Valor não pode ser negativo")

        # Parse da data
        try:
            expense_date = datetime.fromisoformat(data.date)
        except:
            raise HTTPException(400, "Data inválida. Use formato YYYY-MM-DD")

        # Atualizar campos
        expense.date = expense_date
        expense.month = expense_date.month
        expense.year = expense_date.year
        expense.expense_type = data.expense_type
        expense.expense_name = data.expense_name
        expense.amount = data.amount
        expense.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(expense)

        return {
            "id": expense.id,
            "date": expense.date.isoformat() if expense.date else None,
            "expense_type": expense.expense_type,
            "expense_name": expense.expense_name,
            "amount": float(expense.amount)
        }

@r.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user=Depends(require_roles("admin","supervisor"))
):
    """Remove uma despesa"""
    with SessionLocal() as db:
        from ..models import FinanceExpense
        expense = db.get(FinanceExpense, expense_id)

        if not expense:
            raise HTTPException(404, "Despesa não encontrada")

        db.delete(expense)
        db.commit()

        return {"message": "Despesa removida com sucesso"}

# Gestão de Receitas Manuais

class IncomeInput(BaseModel):
    date: str  # "YYYY-MM-DD"
    income_type: str  # Tipo da receita
    income_name: str | None = None  # Nome/descrição da receita
    amount: float

@r.get("/incomes")
def list_incomes(user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Lista todas as receitas manuais"""
    with SessionLocal() as db:
        from ..models import FinanceIncome
        incomes = db.query(FinanceIncome).order_by(
            FinanceIncome.date.desc()
        ).all()

        total = sum([float(inc.amount) for inc in incomes])

        return {
            "items": [
                {
                    "id": inc.id,
                    "date": inc.date.isoformat() if inc.date else None,
                    "income_type": inc.income_type,
                    "income_name": inc.income_name,
                    "amount": float(inc.amount),
                    "created_by": inc.created_by,
                    "created_at": inc.created_at.isoformat() if inc.created_at else None
                }
                for inc in incomes
            ],
            "total": round(total, 2)
        }

@r.post("/incomes")
def create_income(data: IncomeInput, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Cria uma nova receita manual"""
    with SessionLocal() as db:
        from ..models import FinanceIncome

        # Validações
        if data.amount < 0:
            raise HTTPException(400, "Valor não pode ser negativo")

        # Parse da data
        try:
            income_date = datetime.fromisoformat(data.date)
        except:
            raise HTTPException(400, "Data inválida. Use formato YYYY-MM-DD")

        income = FinanceIncome(
            date=income_date,
            income_type=data.income_type,
            income_name=data.income_name,
            amount=data.amount,
            created_by=user.id
        )
        db.add(income)
        db.commit()
        db.refresh(income)

        return {
            "id": income.id,
            "date": income.date.isoformat() if income.date else None,
            "income_type": income.income_type,
            "income_name": income.income_name,
            "amount": float(income.amount),
            "created_by": income.created_by,
            "created_at": income.created_at.isoformat() if income.created_at else None
        }

@r.put("/incomes/{income_id}")
def update_income(income_id: int, data: IncomeInput, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Atualiza uma receita existente"""
    with SessionLocal() as db:
        from ..models import FinanceIncome

        income = db.get(FinanceIncome, income_id)
        if not income:
            raise HTTPException(404, "Receita não encontrada")

        # Validações
        if data.amount < 0:
            raise HTTPException(400, "Valor não pode ser negativo")

        # Parse da data
        try:
            income_date = datetime.fromisoformat(data.date)
        except:
            raise HTTPException(400, "Data inválida. Use formato YYYY-MM-DD")

        # Atualizar campos
        income.date = income_date
        income.income_type = data.income_type
        income.income_name = data.income_name
        income.amount = data.amount
        income.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(income)

        return {
            "id": income.id,
            "date": income.date.isoformat() if income.date else None,
            "income_type": income.income_type,
            "income_name": income.income_name,
            "amount": float(income.amount)
        }

@r.delete("/incomes/{income_id}")
def delete_income(income_id: int, user=Depends(require_roles("admin","supervisor"))):
    """Remove uma receita manual"""
    with SessionLocal() as db:
        from ..models import FinanceIncome

        income = db.get(FinanceIncome, income_id)
        if not income:
            raise HTTPException(404, "Receita não encontrada")

        db.delete(income)
        db.commit()

        return {"message": "Receita removida com sucesso"}

# Séries Temporais para Gráficos

@r.get("/timeseries")
def get_timeseries(user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Retorna séries temporais agregadas por mês para alimentar gráficos"""
    from ..models import FinanceIncome, FinanceExpense, Simulation
    from sqlalchemy import func, extract
    from datetime import datetime, timedelta
    from collections import defaultdict

    with SessionLocal() as db:
        # Definir intervalo de tempo (últimos 6 meses)
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        # Agregação de receitas por mês (consultoria líquida)
        revenue_query = db.query(
            extract('year', Simulation.updated_at).label('year'),
            extract('month', Simulation.updated_at).label('month'),
            func.sum(Simulation.custo_consultoria_liquido).label('total')
        ).join(Case).filter(
            Simulation.status == "approved",
            Simulation.updated_at >= six_months_ago
        ).group_by('year', 'month').all()

        revenue_dict = {}
        for row in revenue_query:
            key = f"{int(row.year)}-{int(row.month):02d}"
            revenue_dict[key] = float(row.total or 0)

        # Agregação de receitas manuais por mês
        manual_income_query = db.query(
            extract('year', FinanceIncome.date).label('year'),
            extract('month', FinanceIncome.date).label('month'),
            func.sum(FinanceIncome.amount).label('total')
        ).filter(
            FinanceIncome.date >= six_months_ago
        ).group_by('year', 'month').all()

        for row in manual_income_query:
            key = f"{int(row.year)}-{int(row.month):02d}"
            revenue_dict[key] = revenue_dict.get(key, 0) + float(row.total or 0)

        # Agregação de despesas por mês
        expenses_query = db.query(
            FinanceExpense.year,
            FinanceExpense.month,
            FinanceExpense.amount
        ).filter(
            FinanceExpense.year >= six_months_ago.year
        ).all()

        expenses_dict = {}
        for row in expenses_query:
            key = f"{row.year}-{row.month:02d}"
            expenses_dict[key] = float(row.amount or 0)

        # Calcular impostos (14% da consultoria) por mês
        tax_query = db.query(
            extract('year', Simulation.updated_at).label('year'),
            extract('month', Simulation.updated_at).label('month'),
            func.sum(Simulation.custo_consultoria).label('total')
        ).join(Case).filter(
            Simulation.status == "approved",
            Simulation.updated_at >= six_months_ago
        ).group_by('year', 'month').all()

        tax_dict = {}
        for row in tax_query:
            key = f"{int(row.year)}-{int(row.month):02d}"
            tax_dict[key] = float(row.total or 0) * 0.14

        # Gerar lista de meses completa
        months = []
        current = datetime.utcnow().replace(day=1)
        for i in range(6):
            month_key = current.strftime("%Y-%m")
            month_label = current.strftime("%b/%Y")
            months.insert(0, {
                "key": month_key,
                "label": month_label
            })
            # Voltar um mês
            if current.month == 1:
                current = current.replace(year=current.year - 1, month=12)
            else:
                current = current.replace(month=current.month - 1)

        # Montar séries
        revenue_series = []
        expenses_series = []
        tax_series = []
        net_profit_series = []

        for month in months:
            key = month["key"]
            revenue = revenue_dict.get(key, 0)
            expenses = expenses_dict.get(key, 0)
            tax = tax_dict.get(key, 0)
            net_profit = revenue - expenses - tax

            revenue_series.append({"date": month["label"], "value": round(revenue, 2)})
            expenses_series.append({"date": month["label"], "value": round(expenses, 2)})
            tax_series.append({"date": month["label"], "value": round(tax, 2)})
            net_profit_series.append({"date": month["label"], "value": round(net_profit, 2)})

        return {
            "revenue": revenue_series,
            "expenses": expenses_series,
            "tax": tax_series,
            "netProfit": net_profit_series
        }

# Buscar detalhes de contrato individual

@r.get("/contracts/{contract_id}")
def get_contract_details(contract_id: int, user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Retorna detalhes completos de um contrato específico"""
    from ..models import ContractAttachment

    with SessionLocal() as db:
        contract = db.get(Contract, contract_id)
        if not contract:
            raise HTTPException(404, "Contrato não encontrado")

        # Buscar caso e cliente associados
        case = db.get(Case, contract.case_id)
        client = db.get(Client, case.client_id) if case else None

        # Buscar anexos
        attachments = db.query(ContractAttachment).filter(
            ContractAttachment.contract_id == contract_id
        ).all()

        return {
            "id": contract.id,
            "case_id": contract.case_id,
            "status": contract.status,
            "total_amount": float(contract.total_amount or 0),
            "installments": contract.installments,
            "paid_installments": contract.paid_installments,
            "disbursed_at": contract.disbursed_at.isoformat() if contract.disbursed_at else None,
            "created_at": contract.created_at.isoformat() if contract.created_at else None,
            "consultoria_valor_liquido": float(contract.consultoria_valor_liquido or 0),
            "client": {
                "id": client.id,
                "name": client.name,
                "cpf": client.cpf,
                "matricula": client.matricula,
                "orgao": getattr(client, "orgao", None)
            } if client else None,
            "case": {
                "id": case.id,
                "status": case.status
            } if case else None,
            "attachments": [
                {
                    "id": att.id,
                    "filename": att.filename,
                    "size": att.size,
                    "mime": att.mime,
                    "created_at": att.created_at.isoformat() if att.created_at else None
                } for att in attachments
            ]
        }

# Endpoint unificado de Receitas e Despesas

@r.get("/transactions")
def get_transactions(
    start_date: str | None = None,
    end_date: str | None = None,
    transaction_type: str | None = None,  # "receita", "despesa", ou None (todos)
    user=Depends(require_roles("admin","supervisor","financeiro"))
):
    """Retorna receitas e despesas unificadas com filtros opcionais"""
    from ..models import FinanceIncome, FinanceExpense
    from datetime import datetime

    with SessionLocal() as db:
        # Parse de datas se fornecidas
        start = None
        end = None
        if start_date:
            try:
                start = datetime.fromisoformat(start_date)
            except:
                pass
        if end_date:
            try:
                end = datetime.fromisoformat(end_date)
            except:
                pass

        transactions = []

        # Buscar receitas
        if not transaction_type or transaction_type == "receita":
            incomes_query = db.query(FinanceIncome)
            if start:
                incomes_query = incomes_query.filter(FinanceIncome.date >= start)
            if end:
                incomes_query = incomes_query.filter(FinanceIncome.date <= end)

            incomes = incomes_query.all()
            for inc in incomes:
                transactions.append({
                    "id": f"receita-{inc.id}",
                    "type": "receita",
                    "date": inc.date.isoformat() if inc.date else None,
                    "category": inc.income_type,
                    "name": inc.income_name,
                    "amount": float(inc.amount),
                    "created_by": inc.created_by,
                    "created_at": inc.created_at.isoformat() if inc.created_at else None
                })

        # Buscar despesas
        if not transaction_type or transaction_type == "despesa":
            expenses_query = db.query(FinanceExpense)
            if start:
                expenses_query = expenses_query.filter(FinanceExpense.date >= start)
            if end:
                expenses_query = expenses_query.filter(FinanceExpense.date <= end)

            expenses = expenses_query.all()
            for exp in expenses:
                transactions.append({
                    "id": f"despesa-{exp.id}",
                    "type": "despesa",
                    "date": exp.date.isoformat() if exp.date else None,
                    "category": exp.expense_type,
                    "name": exp.expense_name,
                    "amount": float(exp.amount),
                    "created_by": exp.created_by,
                    "created_at": exp.created_at.isoformat() if exp.created_at else None
                })

        # Ordenar por data (mais recente primeiro)
        transactions.sort(key=lambda x: x["date"] if x["date"] else "", reverse=True)

        # Calcular totais
        total_receitas = sum([t["amount"] for t in transactions if t["type"] == "receita"])
        total_despesas = sum([t["amount"] for t in transactions if t["type"] == "despesa"])
        saldo = total_receitas - total_despesas

        return {
            "items": transactions,
            "total": len(transactions),
            "totals": {
                "receitas": round(total_receitas, 2),
                "despesas": round(total_despesas, 2),
                "saldo": round(saldo, 2)
            }
        }

# Exportação de Relatórios

@r.get("/export")
def export_finance_report(user=Depends(require_roles("admin","supervisor","financeiro"))):
    """Gera relatório CSV consolidado de finanças"""
    from ..models import FinanceIncome, FinanceExpense, Simulation
    from datetime import datetime, timedelta

    with SessionLocal() as db:
        # Buscar dados dos últimos 6 meses
        six_months_ago = datetime.utcnow() - timedelta(days=180)

        # Preparar dados para o CSV
        rows = []

        # Consultorias aprovadas
        simulations = db.query(Simulation).join(Case).filter(
            Simulation.status == "approved",
            Simulation.updated_at >= six_months_ago
        ).all()

        for sim in simulations:
            rows.append({
                "date": sim.updated_at.strftime("%Y-%m-%d") if sim.updated_at else "",
                "type": "consultoria",
                "description": f"Consultoria líquida - Caso #{sim.case_id}",
                "amount": float(sim.custo_consultoria_liquido or 0)
            })
            rows.append({
                "date": sim.updated_at.strftime("%Y-%m-%d") if sim.updated_at else "",
                "type": "tax",
                "description": f"Imposto (14%) - Caso #{sim.case_id}",
                "amount": float(sim.custo_consultoria or 0) * 0.14
            })

        # Receitas manuais
        incomes = db.query(FinanceIncome).filter(
            FinanceIncome.date >= six_months_ago
        ).all()

        for inc in incomes:
            rows.append({
                "date": inc.date.strftime("%Y-%m-%d") if inc.date else "",
                "type": "manual_income",
                "description": inc.description or "Receita manual",
                "amount": float(inc.amount or 0)
            })

        # Despesas
        expenses = db.query(FinanceExpense).filter(
            FinanceExpense.year >= six_months_ago.year
        ).all()

        for exp in expenses:
            rows.append({
                "date": f"{exp.year}-{exp.month:02d}-01",
                "type": "expense",
                "description": exp.description or f"Despesas {exp.month}/{exp.year}",
                "amount": float(exp.amount or 0)
            })

        # Ordenar por data
        rows.sort(key=lambda x: x["date"], reverse=True)

        # Gerar CSV
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["date", "type", "description", "amount"])
        writer.writeheader()
        writer.writerows(rows)

        # Retornar como arquivo CSV
        csv_content = output.getvalue()
        output.close()

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=finance_report.csv"
            }
        )
