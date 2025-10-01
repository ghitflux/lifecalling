"""
Script para garantir que existam 3 usuários de cada role
Não remove usuários existentes, apenas adiciona os que faltam
"""
from app.db import SessionLocal
from app.models import User
from app.security import hash_password

def ensure_users():
    """Garante que existam pelo menos 3 usuários de cada role"""
    with SessionLocal() as db:
        users_template = {
            "admin": [
                ("Admin Principal", "admin@lifecalling.com", "admin123"),
                ("Admin Secundário", "admin2@lifecalling.com", "admin123"),
                ("Admin Backup", "admin3@lifecalling.com", "admin123"),
            ],
            "supervisor": [
                ("Supervisor João", "supervisor@lifecalling.com", "super123"),
                ("Supervisor Maria", "supervisor2@lifecalling.com", "super123"),
                ("Supervisor Pedro", "supervisor3@lifecalling.com", "super123"),
            ],
            "financeiro": [
                ("Financeiro Carlos", "financeiro@lifecalling.com", "fin123"),
                ("Financeiro Ana", "financeiro2@lifecalling.com", "fin123"),
                ("Financeiro Rita", "financeiro3@lifecalling.com", "fin123"),
            ],
            "calculista": [
                ("Calculista Lucas", "calculista@lifecalling.com", "calc123"),
                ("Calculista Julia", "calculista2@lifecalling.com", "calc123"),
                ("Calculista Bruno", "calculista3@lifecalling.com", "calc123"),
            ],
            "atendente": [
                ("Atendente Paula", "atendente@lifecalling.com", "atend123"),
                ("Atendente Marcos", "atendente2@lifecalling.com", "atend123"),
                ("Atendente Sandra", "atendente3@lifecalling.com", "atend123"),
            ]
        }

        print("="*60)
        print("GARANTINDO USUARIOS NO BANCO DE DADOS")
        print("="*60)

        for role, users in users_template.items():
            print(f"\n{role.upper()}:")

            for name, email, password in users:
                # Verificar se já existe
                existing = db.query(User).filter(User.email == email).first()

                if existing:
                    print(f"  [OK] {name} - JA EXISTE")
                else:
                    # Criar novo usuário
                    user = User(
                        name=name,
                        email=email,
                        password_hash=hash_password(password),
                        role=role,
                        active=True
                    )
                    db.add(user)
                    print(f"  [+] {name} - CRIADO")

        db.commit()
        print("\n" + "="*60)
        print("RESUMO FINAL")
        print("="*60)

        for role in ["admin", "supervisor", "financeiro", "calculista", "atendente"]:
            count = db.query(User).filter(User.role == role, User.active == True).count()
            print(f"{role.upper()}: {count} usuarios ativos")

        print("\n[OK] Script concluido!")
        print("\nCREDENCIAIS DE ACESSO:")
        print("  Admin:       admin@lifecalling.com / admin123")
        print("  Supervisor:  supervisor@lifecalling.com / super123")
        print("  Financeiro:  financeiro@lifecalling.com / fin123")
        print("  Calculista:  calculista@lifecalling.com / calc123")
        print("  Atendente:   atendente@lifecalling.com / atend123")

if __name__ == "__main__":
    ensure_users()
