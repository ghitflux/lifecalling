#!/usr/bin/env python3
"""
Script para limpar todos os usuários e criar novos usuários conforme especificado:
- 2 admin
- 2 supervisor
- 2 financeiro
- 2 calculistas
- 7 atendentes
"""

import sys
sys.path.append('/app')

from app.db import SessionLocal
from app.models import User, Notification, CaseEvent, Case, Simulation, Attachment, ContractAttachment, FinanceExpense, FinanceIncome, Import, ImportBatch
from app.security import hash_password
from datetime import datetime

def clear_all_data(db):
    """Limpa todos os dados relacionados aos usuários"""
    print("🧹 Limpando dados existentes...")

    try:
        # 1. Remover notificações
        notifications_deleted = db.query(Notification).delete()
        print(f"   - Removidas {notifications_deleted} notificações")

        # 2. Remover eventos de casos
        case_events_deleted = db.query(CaseEvent).delete()
        print(f"   - Removidos {case_events_deleted} eventos de casos")

        # 3. Limpar referências de usuários nos casos
        cases_updated = db.query(Case).update({
            Case.assigned_user_id: None
        })
        print(f"   - Atualizados {cases_updated} casos (referências removidas)")

        # 4. Limpar referências em simulações
        simulations_updated = db.query(Simulation).update({
            Simulation.created_by: None
        })
        print(f"   - Atualizadas {simulations_updated} simulações")

        # 5. Limpar referências em anexos
        attachments_updated = db.query(Attachment).update({
            Attachment.uploaded_by: None
        })
        print(f"   - Atualizados {attachments_updated} anexos")

        # 6. Limpar referências em anexos de contratos
        contract_attachments_updated = db.query(ContractAttachment).update({
            ContractAttachment.uploaded_by: None
        })
        print(f"   - Atualizados {contract_attachments_updated} anexos de contratos")

        # 7. Limpar referências em despesas financeiras
        finance_expenses_updated = db.query(FinanceExpense).update({
            FinanceExpense.created_by: None
        })
        print(f"   - Atualizadas {finance_expenses_updated} despesas financeiras")

        # 8. Limpar referências em receitas financeiras
        finance_incomes_updated = db.query(FinanceIncome).update({
            FinanceIncome.created_by: None
        })
        print(f"   - Atualizadas {finance_incomes_updated} receitas financeiras")

        # 9. Limpar referências em imports
        imports_updated = db.query(Import).update({
            Import.created_by: None
        })
        print(f"   - Atualizados {imports_updated} imports")

        # 10. Limpar referências em import_batches
        import_batches_updated = db.query(ImportBatch).update({
            ImportBatch.created_by: None
        })
        print(f"   - Atualizados {import_batches_updated} lotes de importação")

        # 11. Finalmente, deletar todos os usuários
        users_deleted = db.query(User).delete()
        print(f"   - Removidos {users_deleted} usuários")

        db.commit()
        print("✅ Limpeza concluída com sucesso!")

    except Exception as e:
        db.rollback()
        raise e

def create_new_users(db):
    """Cria os novos usuários conforme especificado"""
    print("👥 Criando novos usuários...")

    users_to_create = [
        # 2 Administradores
        {"name": "Admin Um", "email": "admin1@lifecalling.com", "role": "admin"},
        {"name": "Admin Dois", "email": "admin2@lifecalling.com", "role": "admin"},

        # 2 Supervisores
        {"name": "Supervisor Um", "email": "supervisor1@lifecalling.com", "role": "supervisor"},
        {"name": "Supervisor Dois", "email": "supervisor2@lifecalling.com", "role": "supervisor"},

        # 2 Financeiros
        {"name": "Financeiro Um", "email": "financeiro1@lifecalling.com", "role": "financeiro"},
        {"name": "Financeiro Dois", "email": "financeiro2@lifecalling.com", "role": "financeiro"},

        # 2 Calculistas
        {"name": "Calculista Um", "email": "calculista1@lifecalling.com", "role": "calculista"},
        {"name": "Calculista Dois", "email": "calculista2@lifecalling.com", "role": "calculista"},

        # 7 Atendentes
        {"name": "Atendente Um", "email": "atendente1@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Dois", "email": "atendente2@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Três", "email": "atendente3@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Quatro", "email": "atendente4@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Cinco", "email": "atendente5@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Seis", "email": "atendente6@lifecalling.com", "role": "atendente"},
        {"name": "Atendente Sete", "email": "atendente7@lifecalling.com", "role": "atendente"},
    ]

    created_users = []
    default_password = "123456"

    for user_data in users_to_create:
        user = User(
            name=user_data["name"],
            email=user_data["email"],
            password_hash=hash_password(default_password),
            role=user_data["role"],
            active=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        created_users.append({
            "name": user_data["name"],
            "email": user_data["email"],
            "role": user_data["role"],
            "password": default_password
        })

    db.commit()
    print(f"✅ Criados {len(created_users)} usuários com sucesso!")

    return created_users

def show_credentials(db):
    """Mostra as credenciais dos usuários criados"""
    print("\n" + "="*60)
    print("🔑 CREDENCIAIS DOS USUÁRIOS CRIADOS")
    print("="*60)
    print("Senha padrão para todos: 123456")
    print("-"*60)

    users = db.query(User).order_by(User.role, User.name).all()

    current_role = None
    for user in users:
        if user.role != current_role:
            current_role = user.role
            print(f"\n📋 {current_role.upper()}:")

        print(f"   • {user.name}")
        print(f"     Email: {user.email}")
        print("     Senha: 123456")

def main():
    print("🚀 Iniciando processo de limpeza e criação de usuários...")

    try:
        db = SessionLocal()

        # 1. Limpar dados existentes
        clear_all_data(db)

        # 2. Criar novos usuários
        create_new_users(db)

        # 3. Mostrar credenciais
        show_credentials(db)

        print("\n✅ Processo concluído com sucesso!")

    except Exception as e:
        print(f"\n❌ Erro durante o processo: {e}")
        return 1
    finally:
        db.close()

    return 0

if __name__ == "__main__":
    exit(main())
