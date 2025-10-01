"""
Cria 15 usuários padrão (3 de cada role)
"""
from app.db import SessionLocal
from app.models import User
from app.security import hash_password, verify_password

def create_all_users():
    """Cria todos os usuários necessários"""
    with SessionLocal() as db:
        print("="*60)
        print("CRIANDO 15 USUARIOS PADRAO")
        print("="*60)

        users_to_create = [
            # Admins (3)
            ("Admin Principal", "admin@lifecalling.com", "admin123", "admin"),
            ("Admin Secundário", "admin2@lifecalling.com", "admin123", "admin"),
            ("Admin Backup", "admin3@lifecalling.com", "admin123", "admin"),

            # Supervisores (3)
            ("Supervisor João", "supervisor@lifecalling.com", "super123", "supervisor"),
            ("Supervisor Maria", "supervisor2@lifecalling.com", "super123", "supervisor"),
            ("Supervisor Pedro", "supervisor3@lifecalling.com", "super123", "supervisor"),

            # Financeiro (3)
            ("Financeiro Carlos", "financeiro@lifecalling.com", "fin123", "financeiro"),
            ("Financeiro Ana", "financeiro2@lifecalling.com", "fin123", "financeiro"),
            ("Financeiro Rita", "financeiro3@lifecalling.com", "fin123", "financeiro"),

            # Calculistas (3)
            ("Calculista Lucas", "calculista@lifecalling.com", "calc123", "calculista"),
            ("Calculista Julia", "calculista2@lifecalling.com", "calc123", "calculista"),
            ("Calculista Bruno", "calculista3@lifecalling.com", "calc123", "calculista"),

            # Atendentes (3)
            ("Atendente Paula", "atendente@lifecalling.com", "atend123", "atendente"),
            ("Atendente Marcos", "atendente2@lifecalling.com", "atend123", "atendente"),
            ("Atendente Sandra", "atendente3@lifecalling.com", "atend123", "atendente"),
        ]

        created_count = 0
        skipped_count = 0

        for name, email, password, role in users_to_create:
            # Verificar se já existe
            existing = db.query(User).filter(User.email == email).first()

            if existing:
                print(f"[SKIP] {email} - JA EXISTE")
                skipped_count += 1
                continue

            # Criar hash da senha
            password_hash = hash_password(password)

            # Verificar se hash está correto
            if not verify_password(password, password_hash):
                print(f"[ERRO] {email} - HASH INVALIDO!")
                continue

            # Criar usuário
            user = User(
                name=name,
                email=email,
                password_hash=password_hash,
                role=role,
                active=True
            )

            db.add(user)
            created_count += 1
            print(f"[OK] {name} - {email} ({role})")

        db.commit()

        print("\n" + "="*60)
        print("RESUMO")
        print("="*60)
        print(f"Usuarios criados: {created_count}")
        print(f"Usuarios existentes: {skipped_count}")

        # Contar por role
        print("\nPOR ROLE:")
        for role in ["admin", "supervisor", "financeiro", "calculista", "atendente"]:
            count = db.query(User).filter(User.role == role, User.active == True).count()
            print(f"  {role.upper()}: {count} usuarios")

        print("\n" + "="*60)
        print("CREDENCIAIS DE ACESSO")
        print("="*60)
        print("Admin:       admin@lifecalling.com / admin123")
        print("Supervisor:  supervisor@lifecalling.com / super123")
        print("Financeiro:  financeiro@lifecalling.com / fin123")
        print("Calculista:  calculista@lifecalling.com / calc123")
        print("Atendente:   atendente@lifecalling.com / atend123")

if __name__ == "__main__":
    create_all_users()
