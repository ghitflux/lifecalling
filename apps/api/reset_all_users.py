"""
Reset completo de usuários e criação de admin teste
"""
from app.db import SessionLocal
from app.models import User, Case, Simulation, FinanceExpense, CaseEvent
from app.security import hash_password
from sqlalchemy import text

def reset_all_users():
    """Remove todos os usuários e cria admin único para teste"""
    with SessionLocal() as db:
        print("="*60)
        print("RESET COMPLETO DE USUARIOS")
        print("="*60)

        try:
            # 1. Remover todas as referências de usuários
            print("\n[1/5] Removendo referencias de usuarios...")

            # Cases
            db.query(Case).update({"assigned_user_id": None})
            print("  - Cases: referencias removidas")

            # Simulations
            simulations_count = db.query(Simulation).count()
            if simulations_count > 0:
                # Não podemos remover created_by, então vamos deletar simulações antigas
                print(f"  - Simulacoes: {simulations_count} encontradas (manteremos por enquanto)")

            # Finance Expenses
            expenses_count = db.query(FinanceExpense).count()
            if expenses_count > 0:
                print(f"  - Despesas: {expenses_count} encontradas (manteremos por enquanto)")

            db.commit()

            # 2. Contar usuários antes
            print("\n[2/5] Contando usuarios atuais...")
            user_count = db.query(User).count()
            print(f"  - Total de usuarios: {user_count}")

            # 3. Deletar TODOS os usuários (usando raw SQL para evitar FK constraints)
            print("\n[3/5] Deletando TODOS os usuarios...")

            # Método mais seguro: deletar um por um
            users = db.query(User).all()
            for user in users:
                try:
                    # Atualizar referências que ainda apontam para este user
                    db.execute(text("UPDATE simulations SET created_by = NULL WHERE created_by = :user_id"), {"user_id": user.id})
                    db.execute(text("UPDATE finance_expenses SET created_by = NULL WHERE created_by = :user_id"), {"user_id": user.id})

                    db.delete(user)
                    print(f"  - Deletado: {user.email}")
                except Exception as e:
                    print(f"  [!] Erro ao deletar {user.email}: {str(e)}")
                    continue

            db.commit()

            # Verificar
            remaining = db.query(User).count()
            print(f"  - Usuarios restantes: {remaining}")

            # 4. Criar admin único para teste
            print("\n[4/5] Criando usuario ADMIN teste...")

            admin = User(
                name="Admin Principal",
                email="admin@lifecalling.com",
                password_hash=hash_password("admin123"),
                role="admin",
                active=True
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            print(f"  [OK] Admin criado!")
            print(f"      ID: {admin.id}")
            print(f"      Nome: {admin.name}")
            print(f"      Email: {admin.email}")
            print(f"      Senha: admin123")
            print(f"      Role: {admin.role}")
            print(f"      Active: {admin.active}")

            # 5. Testar hash da senha
            print("\n[5/5] Testando hash da senha...")
            from app.security import verify_password

            if verify_password("admin123", admin.password_hash):
                print("  [OK] Senha valida!")
            else:
                print("  [X] ERRO: Senha invalida!")
                return False

            print("\n" + "="*60)
            print("RESET CONCLUIDO COM SUCESSO!")
            print("="*60)
            print("\nCREDENCIAIS DE ACESSO:")
            print("  Email: admin@lifecalling.com")
            print("  Senha: admin123")
            print("\nTESTE O LOGIN:")
            print('  curl -X POST http://localhost:8000/auth/login \\')
            print('    -H "Content-Type: application/json" \\')
            print('    -d \'{"email":"admin@lifecalling.com","password":"admin123"}\' \\')
            print('    -v')

            return True

        except Exception as e:
            print(f"\n[X] ERRO: {str(e)}")
            db.rollback()
            import traceback
            traceback.print_exc()
            return False

if __name__ == "__main__":
    success = reset_all_users()
    exit(0 if success else 1)
