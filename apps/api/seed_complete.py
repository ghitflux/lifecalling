#!/usr/bin/env python3
"""
Script de Seed Completo - LifeCalling
====================================

Cria usuários para todos os roles e dados de exemplo para todos os módulos:
- Usuários: admin, supervisor, calculista, financeiro, 2 atendentes
- Módulos: esteira, calculista, fechamento, financeiro, contratos, dashboard
"""

import sys
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Adiciona o diretório da aplicação ao Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import User, Case, Client, Contract, Payment, Simulation
from app.security import hash_password

def create_users(db):
    """Cria usuários para todos os roles"""
    print("🔧 Criando usuários...")

    users_data = [
        {
            "email": "admin@lifecalling.com",
            "name": "Administrador Sistema",
            "password": "123456",
            "role": "admin"
        },
        {
            "email": "supervisor@lifecalling.com",
            "name": "Supervisor Geral",
            "password": "123456",
            "role": "supervisor"
        },
        {
            "email": "calculista@lifecalling.com",
            "name": "Calculista Senior",
            "password": "123456",
            "role": "calculista"
        },
        {
            "email": "financeiro@lifecalling.com",
            "name": "Analista Financeiro",
            "password": "123456",
            "role": "financeiro"
        },
        {
            "email": "atendente1@lifecalling.com",
            "name": "Atendente Maria Silva",
            "password": "123456",
            "role": "atendente"
        },
        {
            "email": "atendente2@lifecalling.com",
            "name": "Atendente João Santos",
            "password": "123456",
            "role": "atendente"
        }
    ]

    created_users = {}

    for user_data in users_data:
        # Verifica se usuário já existe
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if existing:
            print(f"  ⚠️ Usuário {user_data['email']} já existe")
            created_users[user_data["role"]] = existing
            continue

        # Cria novo usuário
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            active=True
        )

        db.add(user)
        db.flush()  # Para obter o ID
        created_users[user_data["role"]] = user

        print(f"  ✅ Criado: {user_data['name']} ({user_data['email']}) - Role: {user_data['role']}")

    return created_users

def create_clients(db):
    """Cria clientes para os casos"""
    print("🔧 Criando clientes...")

    clients_data = [
        {
            "name": "Maria da Conceição Silva",
            "cpf": "12345678901",
            "matricula": "MAT001",
            "orgao": "INSS",
            "telefone_preferencial": "(11) 99999-0001",
            "numero_cliente": "CLI001",
            "observacoes": "Cliente preferencial"
        },
        {
            "name": "João Carlos Santos",
            "cpf": "23456789012",
            "matricula": "MAT002",
            "orgao": "INSS",
            "telefone_preferencial": "(11) 99999-0002",
            "numero_cliente": "CLI002",
            "observacoes": "Cliente ativo"
        },
        {
            "name": "Ana Paula Oliveira",
            "cpf": "34567890123",
            "matricula": "MAT003",
            "orgao": "INSS",
            "telefone_preferencial": "(11) 99999-0003",
            "numero_cliente": "CLI003",
            "observacoes": "Cliente novo"
        },
        {
            "name": "Pedro Henrique Costa",
            "cpf": "45678901234",
            "matricula": "MAT004",
            "orgao": "INSS",
            "telefone_preferencial": "(11) 99999-0004",
            "numero_cliente": "CLI004",
            "observacoes": "Cliente VIP"
        },
        {
            "name": "Luiza Fernanda Lima",
            "cpf": "56789012345",
            "matricula": "MAT005",
            "orgao": "INSS",
            "telefone_preferencial": "(11) 99999-0005",
            "numero_cliente": "CLI005",
            "observacoes": "Cliente especial"
        }
    ]

    created_clients = []

    for client_data in clients_data:
        # Verifica se cliente já existe
        existing = db.query(Client).filter(Client.cpf == client_data["cpf"]).first()
        if existing:
            print(f"  ⚠️ Cliente {client_data['name']} já existe")
            created_clients.append(existing)
            continue

        # Cria novo cliente
        client = Client(**client_data)
        db.add(client)
        db.flush()
        created_clients.append(client)

        print(f"  ✅ Criado: {client_data['name']} (CPF: {client_data['cpf']})")

    return created_clients

def create_cases(db, clients, users):
    """Cria casos para a esteira"""
    print("🔧 Criando casos para esteira...")

    import random
    from datetime import datetime, timedelta

    statuses = ["novo", "em_atendimento", "aguardando_calculo", "calculado", "fechado"]
    tipos = ["INSS", "FGTS", "PIS/PASEP", "Revisão Aposentadoria", "Auxílio Doença"]

    created_cases = []

    for i, client in enumerate(clients):
        # Cria 2 casos por cliente
        for j in range(2):
            case_data = {
                "client_id": client.id,
                "status": random.choice(statuses)
            }

            # Atribui alguns casos aos atendentes
            if random.choice([True, False]):
                atendentes = [u for u in users.values() if u.role == "atendente"]
                if atendentes:
                    case_data["assigned_user_id"] = random.choice(atendentes).id

            case = Case(**case_data)
            db.add(case)
            db.flush()
            created_cases.append(case)

            print(f"  ✅ Caso criado: ID {case.id} - {client.name} (Status: {case.status})")

    return created_cases

def create_simulations(db, cases, users):
    """Cria simulações para o módulo calculista"""
    print("🔧 Criando simulações...")

    calculista = users.get("calculista")
    if not calculista:
        print("  ⚠️ Usuário calculista não encontrado")
        return []

    created_simulations = []

    for case in cases[:5]:  # Cria simulações para 5 casos
        import random
        valor_estimado = random.uniform(5000, 50000)

        sim_data = {
            "case_id": case.id,
            "status": random.choice(["pending", "approved"]),
            "manual_input": {
                "valor_principal": valor_estimado,
                "tipo_calculo": "INSS",
                "periodo": "2020-2024"
            },
            "results": {
                "valor_total": valor_estimado * 1.15,
                "juros": valor_estimado * 0.1,
                "correcao": valor_estimado * 0.05
            },
            "created_by": calculista.id
        }

        simulation = Simulation(**sim_data)
        db.add(simulation)
        db.flush()
        created_simulations.append(simulation)

        print(f"  ✅ Simulação criada para caso {case.id} - Valor: R$ {sim_data['results']['valor_total']:,.2f}")

    return created_simulations

def create_contracts(db, cases, users):
    """Cria contratos para o módulo contratos"""
    print("🔧 Criando contratos...")

    created_contracts = []

    # Pega casos fechados ou calculados para criar contratos
    cases_for_contract = [c for c in cases if c.status in ["calculado", "fechado"]]

    contract_types = ["Honorários", "Êxito", "Misto"]

    for case in cases_for_contract[:4]:  # Cria contratos para 4 casos
        import random
        valor_total = random.uniform(10000, 80000)

        contract_data = {
            "case_id": case.id,
            "status": random.choice(["ativo", "encerrado"]),
            "total_amount": Decimal(str(valor_total)).quantize(Decimal('0.01')),
            "installments": random.randint(6, 24),
            "paid_installments": random.randint(0, 12)
        }

        contract = Contract(**contract_data)
        db.add(contract)
        db.flush()
        created_contracts.append(contract)

        print(f"  ✅ Contrato criado: ID {contract.id} - Valor: R$ {contract.total_amount:,.2f}")

    return created_contracts

def create_payments(db, contracts, users):
    """Cria pagamentos para os contratos"""
    print("🔧 Criando pagamentos...")

    created_payments = []

    for contract in contracts:
        # Cria pagamentos para parcelas já pagas
        for i in range(contract.paid_installments):
            import random
            payment_data = {
                "contract_id": contract.id,
                "installment_no": i + 1,
                "amount": contract.total_amount / contract.installments,
                "paid_at": datetime.now() - timedelta(days=random.randint(1, 365))
            }

            payment = Payment(**payment_data)
            db.add(payment)
            db.flush()
            created_payments.append(payment)

            print(f"  ✅ Pagamento criado: Parcela {payment.installment_no} - R$ {payment.amount:,.2f}")

    return created_payments

def main():
    """Função principal do seed"""
    print("🚀 Iniciando seed completo do LifeCalling...")
    print("=" * 50)

    try:
        # Conecta ao banco
        db = SessionLocal()

        # 1. Cria usuários
        users = create_users(db)
        db.commit()
        print(f"✅ {len(users)} usuários criados")

        # 2. Cria clientes
        clients = create_clients(db)
        db.commit()
        print(f"✅ {len(clients)} clientes criados")

        # 3. Cria casos (esteira)
        cases = create_cases(db, clients, users)
        db.commit()
        print(f"✅ {len(cases)} casos criados")

        # 4. Cria simulações (calculista)
        simulations = create_simulations(db, cases, users)
        db.commit()
        print(f"✅ {len(simulations)} simulações criadas")

        # 5. Cria contratos
        contracts = create_contracts(db, cases, users)
        db.commit()
        print(f"✅ {len(contracts)} contratos criados")

        # 6. Cria pagamentos
        payments = create_payments(db, contracts, users)
        db.commit()
        print(f"✅ {len(payments)} pagamentos criados")

        print("=" * 50)
        print("🎉 Seed completo executado com sucesso!")
        print("\n📋 Resumo:")
        print(f"   👥 Usuários: {len(users)}")
        print(f"   👤 Clientes: {len(clients)}")
        print(f"   📋 Casos: {len(cases)}")
        print(f"   🧮 Simulações: {len(simulations)}")
        print(f"   📄 Contratos: {len(contracts)}")
        print(f"   💰 Pagamentos: {len(payments)}")

        print("\n🔑 Credenciais de login:")
        print("   Admin: admin@lifecalling.com / 123456")
        print("   Supervisor: supervisor@lifecalling.com / 123456")
        print("   Calculista: calculista@lifecalling.com / 123456")
        print("   Financeiro: financeiro@lifecalling.com / 123456")
        print("   Atendente 1: atendente1@lifecalling.com / 123456")
        print("   Atendente 2: atendente2@lifecalling.com / 123456")

    except Exception as e:
        print(f"❌ Erro durante o seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()