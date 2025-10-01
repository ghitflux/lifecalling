"""
Script para popular banco de dados com usuários de teste
3 usuários por role
"""
from app.db import SessionLocal
from app.models import User
from app.security import hash_password
from datetime import datetime

def clear_users():
    """Remove referências de casos e depois remove todos os usuários"""
    from app.models import Case
    with SessionLocal() as db:
        # Primeiro, remover referências de casos
        db.query(Case).update({"assigned_user_id": None})
        db.commit()
        print("[OK] Referencias de casos removidas")

        # Depois remover usuários
        db.query(User).delete()
        db.commit()
        print("[OK] Usuarios removidos")

def create_users():
    """Cria 3 usuários de cada role"""
    with SessionLocal() as db:
        users_to_create = [
            # Admins
            {
                "name": "Admin Principal",
                "email": "admin@lifecalling.com",
                "password": "admin123",
                "role": "admin",
                "active": True
            },
            {
                "name": "Admin Secundário",
                "email": "admin2@lifecalling.com",
                "password": "admin123",
                "role": "admin",
                "active": True
            },
            {
                "name": "Admin Backup",
                "email": "admin3@lifecalling.com",
                "password": "admin123",
                "role": "admin",
                "active": True
            },

            # Supervisores
            {
                "name": "Supervisor João",
                "email": "supervisor@lifecalling.com",
                "password": "super123",
                "role": "supervisor",
                "active": True
            },
            {
                "name": "Supervisor Maria",
                "email": "supervisor2@lifecalling.com",
                "password": "super123",
                "role": "supervisor",
                "active": True
            },
            {
                "name": "Supervisor Pedro",
                "email": "supervisor3@lifecalling.com",
                "password": "super123",
                "role": "supervisor",
                "active": True
            },

            # Financeiro
            {
                "name": "Financeiro Carlos",
                "email": "financeiro@lifecalling.com",
                "password": "fin123",
                "role": "financeiro",
                "active": True
            },
            {
                "name": "Financeiro Ana",
                "email": "financeiro2@lifecalling.com",
                "password": "fin123",
                "role": "financeiro",
                "active": True
            },
            {
                "name": "Financeiro Rita",
                "email": "financeiro3@lifecalling.com",
                "password": "fin123",
                "role": "financeiro",
                "active": True
            },

            # Calculistas
            {
                "name": "Calculista Lucas",
                "email": "calculista@lifecalling.com",
                "password": "calc123",
                "role": "calculista",
                "active": True
            },
            {
                "name": "Calculista Julia",
                "email": "calculista2@lifecalling.com",
                "password": "calc123",
                "role": "calculista",
                "active": True
            },
            {
                "name": "Calculista Bruno",
                "email": "calculista3@lifecalling.com",
                "password": "calc123",
                "role": "calculista",
                "active": True
            },

            # Atendentes
            {
                "name": "Atendente Paula",
                "email": "atendente@lifecalling.com",
                "password": "atend123",
                "role": "atendente",
                "active": True
            },
            {
                "name": "Atendente Marcos",
                "email": "atendente2@lifecalling.com",
                "password": "atend123",
                "role": "atendente",
                "active": True
            },
            {
                "name": "Atendente Sandra",
                "email": "atendente3@lifecalling.com",
                "password": "atend123",
                "role": "atendente",
                "active": True
            }
        ]

        print("\n[+] Criando usuarios...")
        for user_data in users_to_create:
            user = User(
                name=user_data["name"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                active=user_data["active"]
            )
            db.add(user)
            print(f"  [OK] {user_data['name']} ({user_data['role']}) - {user_data['email']}")

        db.commit()
        print(f"\n[OK] {len(users_to_create)} usuarios criados!")

def show_summary():
    """Mostra resumo dos usuários criados"""
    with SessionLocal() as db:
        print("\n" + "="*60)
        print("RESUMO DE USUARIOS")
        print("="*60)

        for role in ["admin", "supervisor", "financeiro", "calculista", "atendente"]:
            users = db.query(User).filter(User.role == role).all()
            print(f"\n{role.upper()}:")
            for user in users:
                print(f"  - {user.name}")
                print(f"    Email: {user.email}")
                print(f"    Senha: [veja o codigo acima]")
                print()

if __name__ == "__main__":
    print("="*60)
    print("POPULANDO BANCO DE DADOS COM USUARIOS")
    print("="*60)

    clear_users()
    create_users()
    show_summary()

    print("\n[OK] Script concluido com sucesso!")
    print("\nCREDENCIAIS DE ACESSO:")
    print("  Admin:       admin@lifecalling.com / admin123")
    print("  Supervisor:  supervisor@lifecalling.com / super123")
    print("  Financeiro:  financeiro@lifecalling.com / fin123")
    print("  Calculista:  calculista@lifecalling.com / calc123")
    print("  Atendente:   atendente@lifecalling.com / atend123")
