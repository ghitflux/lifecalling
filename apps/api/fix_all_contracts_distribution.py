"""
Script para corrigir distribuição de TODOS os contratos

Este script:
1. Busca todos os contratos ativos
2. Verifica se têm registros em ContractAgent
3. Se não tiver, cria baseado na distribuição de FinanceIncome
4. Gera um relatório completo
"""

from app.db import SessionLocal
from app.models import Contract, Case, Client, ContractAgent, FinanceIncome, User
from sqlalchemy import and_

def fix_all_contracts():
    """Corrige a distribuição de todos os contratos"""

    print(f"\n{'='*80}")
    print(f"CORREÇÃO DE DISTRIBUIÇÃO DE TODOS OS CONTRATOS")
    print(f"{'='*80}\n")

    db = SessionLocal()

    try:
        # 1. Buscar todos os contratos ativos
        contracts = db.query(Contract).filter(Contract.status == "ativo").all()

        print(f"✅ Total de contratos ativos: {len(contracts)}\n")

        fixed_count = 0
        already_fixed_count = 0
        no_distribution_count = 0

        for contract in contracts:
            # Buscar caso e cliente
            case = db.query(Case).filter(Case.id == contract.case_id).first()
            if not case:
                continue

            client = db.query(Client).filter(Client.id == case.client_id).first()
            if not client:
                continue

            # Verificar se já tem ContractAgent
            existing_agents = db.query(ContractAgent).filter(
                ContractAgent.contract_id == contract.id
            ).all()

            if existing_agents:
                already_fixed_count += 1
                continue

            # Buscar distribuição em FinanceIncome
            incomes = db.query(FinanceIncome).filter(
                and_(
                    FinanceIncome.income_name.like(f"%Contrato #{contract.id}%"),
                    FinanceIncome.income_type.in_([
                        "Consultoria Líquida - Atendente",
                        "Consultoria Líquida - Atendente 1",
                        "Consultoria Líquida - Atendente 2",
                        "Consultoria Líquida - Balcão",
                        "Consultoria Líquida"
                    ])
                )
            ).all()

            if not incomes:
                no_distribution_count += 1
                continue

            # Calcular distribuição
            consultoria_total = float(contract.consultoria_valor_liquido or 0)
            if consultoria_total == 0:
                continue

            distribution = []
            for income in incomes:
                valor = float(income.amount)
                percentual = (valor / consultoria_total * 100) if consultoria_total > 0 else 0

                distribution.append({
                    "user_id": income.agent_user_id,
                    "percentual": round(percentual, 2),
                    "is_primary": income.income_type in ["Consultoria Líquida - Atendente", "Consultoria Líquida - Atendente 1"]
                })

            # Criar registros em ContractAgent
            for dist in distribution:
                agent = ContractAgent(
                    contract_id=contract.id,
                    user_id=dist["user_id"],
                    percentual=dist["percentual"],
                    is_primary=dist["is_primary"]
                )
                db.add(agent)

            print(f"✅ Contrato #{contract.id} - {client.name} (CPF: {client.cpf[:3]}...{client.cpf[-2:]})")
            for dist in distribution:
                user = db.query(User).filter(User.id == dist["user_id"]).first()
                user_name = user.name if user else f"User ID {dist['user_id']}"
                print(f"   - {user_name}: {dist['percentual']}%")

            fixed_count += 1

        # Commit todas as mudanças
        db.commit()

        print(f"\n{'='*80}")
        print(f"RESUMO DA CORREÇÃO")
        print(f"{'='*80}")
        print(f"Total de contratos ativos: {len(contracts)}")
        print(f"✅ Contratos corrigidos: {fixed_count}")
        print(f"✅ Já tinham distribuição: {already_fixed_count}")
        print(f"⚠️  Sem dados de distribuição: {no_distribution_count}")
        print(f"{'='*80}\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    fix_all_contracts()
