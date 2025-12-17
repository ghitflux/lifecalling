"""
Script para corrigir distribuição de contratos do CPF 600.879.343-96

Este script:
1. Busca o contrato do cliente
2. Verifica se tem registros em ContractAgent
3. Se não tiver, cria os registros baseado na distribuição de FinanceIncome
4. Mostra um relatório das correções aplicadas
"""

from app.db import SessionLocal
from app.models import Contract, Case, Client, ContractAgent, FinanceIncome, User
from sqlalchemy import and_

def fix_contract_distribution(cpf: str):
    """Corrige a distribuição de um contrato específico"""

    # Normalizar CPF (remover pontos e traços)
    cpf_normalized = cpf.replace(".", "").replace("-", "")

    print(f"\n{'='*80}")
    print(f"CORREÇÃO DE DISTRIBUIÇÃO DE CONTRATO")
    print(f"CPF: {cpf}")
    print(f"{'='*80}\n")

    db = SessionLocal()

    try:
        # 1. Buscar cliente
        client = db.query(Client).filter(Client.cpf == cpf_normalized).first()

        if not client:
            print(f"❌ Cliente com CPF {cpf} não encontrado")
            return

        print(f"✅ Cliente encontrado: {client.name} (ID: {client.id})")

        # 2. Buscar caso do cliente
        case = db.query(Case).filter(Case.client_id == client.id).first()

        if not case:
            print(f"❌ Nenhum caso encontrado para o cliente")
            return

        print(f"✅ Caso encontrado: ID {case.id}, Status: {case.status}")

        # 3. Buscar contrato
        contract = db.query(Contract).filter(Contract.case_id == case.id).first()

        if not contract:
            print(f"❌ Nenhum contrato encontrado para o caso")
            return

        print(f"✅ Contrato encontrado: ID {contract.id}")
        print(f"   - Consultoria Líquida Total: R$ {float(contract.consultoria_valor_liquido or 0):.2f}")
        print(f"   - Data Assinatura: {contract.signed_at}")
        print(f"   - Agent User ID: {contract.agent_user_id}")

        # 4. Verificar se já tem ContractAgent
        existing_agents = db.query(ContractAgent).filter(
            ContractAgent.contract_id == contract.id
        ).all()

        print(f"\n📋 Registros em ContractAgent:")
        if existing_agents:
            print(f"   ✅ Encontrados {len(existing_agents)} registro(s):")
            for agent in existing_agents:
                user = db.query(User).filter(User.id == agent.user_id).first()
                user_name = user.name if user else f"User ID {agent.user_id}"
                print(f"   - {user_name}: {agent.percentual}% (Primary: {agent.is_primary})")
        else:
            print(f"   ❌ Nenhum registro encontrado - SERÁ CRIADO")

        # 5. Buscar distribuição em FinanceIncome
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

        print(f"\n💰 Receitas distribuídas (FinanceIncome):")
        if incomes:
            print(f"   ✅ Encontradas {len(incomes)} receita(s):")
            consultoria_total = float(contract.consultoria_valor_liquido or 0)

            distribution = []
            for income in incomes:
                user = db.query(User).filter(User.id == income.agent_user_id).first()
                user_name = user.name if user else f"User ID {income.agent_user_id}"
                valor = float(income.amount)
                percentual = (valor / consultoria_total * 100) if consultoria_total > 0 else 0

                print(f"   - {user_name}: R$ {valor:.2f} ({percentual:.1f}%)")
                print(f"     Tipo: {income.income_type}")

                distribution.append({
                    "user_id": income.agent_user_id,
                    "percentual": round(percentual, 2),
                    "is_primary": income.income_type in ["Consultoria Líquida - Atendente", "Consultoria Líquida - Atendente 1"]
                })
        else:
            print(f"   ❌ Nenhuma receita encontrada")
            distribution = []

        # 6. Aplicar correções
        if not existing_agents and distribution:
            print(f"\n🔧 APLICANDO CORREÇÕES:")
            print(f"   Criando registros em ContractAgent...")

            for dist in distribution:
                agent = ContractAgent(
                    contract_id=contract.id,
                    user_id=dist["user_id"],
                    percentual=dist["percentual"],
                    is_primary=dist["is_primary"]
                )
                db.add(agent)

                user = db.query(User).filter(User.id == dist["user_id"]).first()
                user_name = user.name if user else f"User ID {dist['user_id']}"
                print(f"   ✅ Criado: {user_name} - {dist['percentual']}% (Primary: {dist['is_primary']})")

            db.commit()
            print(f"\n✅ CORREÇÕES APLICADAS COM SUCESSO!")

        elif existing_agents:
            print(f"\n✅ NENHUMA CORREÇÃO NECESSÁRIA - Registros já existem")
        else:
            print(f"\n⚠️  NENHUMA CORREÇÃO POSSÍVEL - Sem dados de distribuição em FinanceIncome")

        # 7. Verificar resultado final
        print(f"\n📊 RESULTADO FINAL:")
        final_agents = db.query(ContractAgent).filter(
            ContractAgent.contract_id == contract.id
        ).all()

        if final_agents:
            print(f"   Registros em ContractAgent: {len(final_agents)}")
            for agent in final_agents:
                user = db.query(User).filter(User.id == agent.user_id).first()
                user_name = user.name if user else f"User ID {agent.user_id}"
                print(f"   - {user_name}: {agent.percentual}% (Primary: {agent.is_primary})")
        else:
            print(f"   ❌ Nenhum registro em ContractAgent")

        print(f"\n{'='*80}")
        print(f"CORREÇÃO FINALIZADA")
        print(f"{'='*80}\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    # CPF do cliente
    cpf = "600.879.343-96"
    fix_contract_distribution(cpf)
