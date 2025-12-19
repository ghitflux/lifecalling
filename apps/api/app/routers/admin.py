from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..rbac import require_roles
from ..models import (
    Case, Client, Contract, Simulation,
    FinanceIncome, FinanceExpense, CaseEvent,
    ClientPhone
)

r = APIRouter(prefix="/admin", tags=["admin"])


@r.post("/clear-all-data")
async def clear_all_data(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """
    ATENÇÃO: Deleta TODOS os dados do sistema exceto usuários!
    Apenas admin pode executar.

    Deleta em ordem:
    - Eventos de casos
    - Histórico de telefones
    - Receitas e Despesas
    - Contratos
    - Simulações
    - Casos
    - Clientes

    Mantém:
    - Usuários
    - Configurações do sistema
    """

    deleted = {
        "case_events": 0,
        "client_phones": 0,
        "finance_income": 0,
        "finance_expense": 0,
        "contracts": 0,
        "simulations": 0,
        "cases": 0,
        "clients": 0,
    }

    try:
        # Ordem: do mais dependente para o menos dependente

        # 1. Eventos de casos
        deleted["case_events"] = db.query(CaseEvent).delete(synchronize_session=False)

        # 2. Histórico de telefones
        deleted["client_phones"] = db.query(ClientPhone).delete(synchronize_session=False)

        # 3. Receitas e Despesas
        deleted["finance_income"] = db.query(FinanceIncome).delete(synchronize_session=False)
        deleted["finance_expense"] = db.query(FinanceExpense).delete(synchronize_session=False)

        # 4. Contratos
        deleted["contracts"] = db.query(Contract).delete(synchronize_session=False)

        # 5. Simulações
        deleted["simulations"] = db.query(Simulation).delete(synchronize_session=False)

        # 6. Casos
        deleted["cases"] = db.query(Case).delete(synchronize_session=False)

        # 7. Clientes
        deleted["clients"] = db.query(Client).delete(synchronize_session=False)

        db.commit()

        return {
            "success": True,
            "message": "Todos os dados foram deletados com sucesso (usuários mantidos)",
            "deleted": deleted,
            "total_deleted": sum(deleted.values())
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao deletar dados: {str(e)}")
