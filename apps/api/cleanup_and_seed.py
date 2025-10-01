#!/usr/bin/env python3
"""
Script de Cleanup e Seed - LifeCalling
======================================

Limpa TODAS as tabelas do banco de dados e cria 15 usuários de teste (3 por role).

ATENÇÃO: Este script apaga TODOS os dados do banco de dados!
"""

import sys
import os
from datetime import datetime

# Adiciona o diretório da aplicação ao Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine
from app.models import (
    User, Case, Client, Contract, Payment, Simulation, Attachment,
    CaseEvent, Notification, ContractAttachment,
    PayrollClient, PayrollContract, PayrollImportBatch, PayrollImportItem,
    ImportBatch, PayrollLine, Import, Base
)
from app.security import hash_password
from sqlalchemy import text


def cleanup_database(db):
    """Limpa todas as tabelas do banco de dados na ordem correta"""
    print("[CLEANUP] Limpando banco de dados...")
    print("=" * 60)

    try:
        # Primeiro: Limpar FKs circulares
        print("  [CLEANUP] Limpando foreign keys circulares...")
        db.execute(text("UPDATE cases SET last_simulation_id = NULL WHERE last_simulation_id IS NOT NULL"))
        db.commit()
        print("  [OK] FKs circulares limpas")

        # Ordem de deleção respeitando foreign keys
        tables_in_order = [
            # Tabelas dependentes (primeiro)
            ("Pagamentos", Payment),
            ("Anexos de Contratos", ContractAttachment),
            ("Contratos", Contract),
            ("Eventos de Casos", CaseEvent),
            ("Anexos", Attachment),
            ("Notificações", Notification),
            ("Simulações", Simulation),  # SIMUL primeiro agora que last_simulation_id foi limpo
            ("Casos", Case),

            # Tabelas de importação
            ("Linhas de Folha", PayrollLine),
            ("Itens de Importação", PayrollImportItem),
            ("Lotes de Importação Payroll", PayrollImportBatch),
            ("Lotes de Importação", ImportBatch),
            ("Importações Legadas", Import),
            ("Contratos de Folha", PayrollContract),
            ("Clientes de Folha", PayrollClient),

            # Tabelas base (último)
            ("Clientes", Client),
            ("Usuários", User),
        ]

        total_deleted = 0

        for table_name, model in tables_in_order:
            count = db.query(model).count()
            if count > 0:
                db.query(model).delete()
                db.commit()
                print(f"  [OK] {table_name}: {count} registros removidos")
                total_deleted += count
            else:
                print(f"  [SKIP] {table_name}: 0 registros (ja vazia)")

        print("=" * 60)
        print(f"[OK] Limpeza concluida! Total de {total_deleted} registros removidos.")
        print()

    except Exception as e:
        print(f"[ERRO] Erro durante a limpeza: {e}")
        db.rollback()
        raise


def create_users(db):
    """Cria 15 usuários (3 por role)"""
    print("[USERS] Criando usuarios...")
    print("=" * 60)

    users_data = [
        # Admins (3)
        {"email": "admin1@lifecalling.com", "name": "Admin Carlos Silva", "password": "123456", "role": "admin"},
        {"email": "admin2@lifecalling.com", "name": "Admin Maria Santos", "password": "123456", "role": "admin"},
        {"email": "admin3@lifecalling.com", "name": "Admin João Oliveira", "password": "123456", "role": "admin"},

        # Supervisores (3)
        {"email": "supervisor1@lifecalling.com", "name": "Supervisor Ana Costa", "password": "123456", "role": "supervisor"},
        {"email": "supervisor2@lifecalling.com", "name": "Supervisor Pedro Lima", "password": "123456", "role": "supervisor"},
        {"email": "supervisor3@lifecalling.com", "name": "Supervisor Lucia Ferreira", "password": "123456", "role": "supervisor"},

        # Calculistas (3)
        {"email": "calculista1@lifecalling.com", "name": "Calculista Roberto Souza", "password": "123456", "role": "calculista"},
        {"email": "calculista2@lifecalling.com", "name": "Calculista Julia Alves", "password": "123456", "role": "calculista"},
        {"email": "calculista3@lifecalling.com", "name": "Calculista Marcos Pereira", "password": "123456", "role": "calculista"},

        # Financeiro (3)
        {"email": "financeiro1@lifecalling.com", "name": "Financeiro Sandra Martins", "password": "123456", "role": "financeiro"},
        {"email": "financeiro2@lifecalling.com", "name": "Financeiro Paulo Rodrigues", "password": "123456", "role": "financeiro"},
        {"email": "financeiro3@lifecalling.com", "name": "Financeiro Carla Mendes", "password": "123456", "role": "financeiro"},

        # Atendentes (3)
        {"email": "atendente1@lifecalling.com", "name": "Atendente Maria Silva", "password": "123456", "role": "atendente"},
        {"email": "atendente2@lifecalling.com", "name": "Atendente João Santos", "password": "123456", "role": "atendente"},
        {"email": "atendente3@lifecalling.com", "name": "Atendente Ana Oliveira", "password": "123456", "role": "atendente"},
    ]

    created_users = []

    for user_data in users_data:
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            active=True,
            created_at=datetime.utcnow()
        )

        db.add(user)
        db.flush()  # Para obter o ID
        created_users.append(user)

        print(f"  [OK] {user_data['role'].upper()}: {user_data['name']} ({user_data['email']})")

    db.commit()

    print("=" * 60)
    print(f"[OK] {len(created_users)} usuarios criados com sucesso!")
    print()

    return created_users


def print_credentials(users):
    """Imprime as credenciais de todos os usuários"""
    print("[CREDENTIALS] Credenciais de Login")
    print("=" * 60)
    print()

    # Agrupar por role
    users_by_role = {}
    for user in users:
        if user.role not in users_by_role:
            users_by_role[user.role] = []
        users_by_role[user.role].append(user)

    # Ordem de exibição
    role_order = ["admin", "supervisor", "calculista", "financeiro", "atendente"]
    role_labels = {
        "admin": "[ADMIN] Administradores",
        "supervisor": "[SUPERVISOR] Supervisores",
        "calculista": "[CALCULISTA] Calculistas",
        "financeiro": "[FINANCEIRO] Financeiro",
        "atendente": "[ATENDENTE] Atendentes"
    }

    for role in role_order:
        if role in users_by_role:
            print(f"{role_labels[role]}")
            print("-" * 60)
            for user in users_by_role[role]:
                print(f"  Email: {user.email}")
                print(f"  Nome: {user.name}")
                print(f"  Senha: 123456")
                print()

    print("=" * 60)
    print("[INFO] Todos os usuarios usam a senha padrao: 123456")
    print()


def main():
    """Função principal"""
    print()
    print("=" * 60)
    print("[START] CLEANUP E SEED - LIFECALLING")
    print("=" * 60)
    print()
    print("[ATENCAO] Este script ira APAGAR TODOS os dados do banco!")
    print()

    # Confirmação
    confirm = input("Digite 'SIM' para confirmar a limpeza: ")
    if confirm.upper() != "SIM":
        print("[CANCELADO] Operacao cancelada pelo usuario.")
        return

    print()

    try:
        # Conecta ao banco
        db = SessionLocal()

        # 1. Limpar banco de dados
        cleanup_database(db)

        # 2. Criar usuários
        users = create_users(db)

        # 3. Exibir credenciais
        print_credentials(users)

        print("=" * 60)
        print("[SUCCESS] Processo concluido com sucesso!")
        print("=" * 60)
        print()
        print("[NEXT STEPS] Proximos passos:")
        print("  1. Acesse http://localhost:3000/login")
        print("  2. Use qualquer email e senha '123456'")
        print("  3. Teste o sistema com diferentes roles")
        print()

    except Exception as e:
        print()
        print("=" * 60)
        print(f"[ERRO] {e}")
        print("=" * 60)
        print()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()