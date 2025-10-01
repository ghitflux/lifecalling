"""
Remove usuários antigos e mantém apenas os novos
"""
from app.db import SessionLocal
from app.models import User, Case

def cleanup_old_users():
    """Remove usuários antigos mockados"""
    with SessionLocal() as db:
        # Emails dos usuários antigos para remover
        old_emails = [
            "admin1@lifecalling.com",
            "admin2@lifecalling.com",
            "admin3@lifecalling.com",
            "supervisor1@lifecalling.com",
            "supervisor2@lifecalling.com",
            "supervisor3@lifecalling.com",
            "calculista1@lifecalling.com",
            "calculista2@lifecalling.com",
            "calculista3@lifecalling.com",
            "financeiro1@lifecalling.com",
            "financeiro2@lifecalling.com",
            "financeiro3@lifecalling.com",
            "atendente1@lifecalling.com",
            "atendente2@lifecalling.com",
            "atendente3@lifecalling.com"
        ]

        print("="*60)
        print("REMOVENDO USUARIOS ANTIGOS")
        print("="*60)

        for email in old_emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                # Remover referências em casos
                db.query(Case).filter(Case.assigned_user_id == user.id).update({"assigned_user_id": None})

                # Remover usuário
                db.delete(user)
                print(f"[X] Removido: {email}")

        db.commit()

        # Mostrar usuários restantes
        print("\n" + "="*60)
        print("USUARIOS RESTANTES")
        print("="*60)

        remaining = db.query(User).all()
        for user in remaining:
            print(f"  {user.name} - {user.email} ({user.role})")

        print(f"\nTotal: {len(remaining)} usuarios")

if __name__ == "__main__":
    cleanup_old_users()
