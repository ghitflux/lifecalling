"""
Corrige nomes dos usuários principais
"""
from app.db import SessionLocal
from app.models import User

def fix_names():
    """Corrige nomes dos usuários"""
    with SessionLocal() as db:
        updates = [
            ("admin@lifecalling.com", "Admin Principal"),
            ("supervisor@lifecalling.com", "Supervisor João"),
            ("calculista@lifecalling.com", "Calculista Lucas"),
            ("financeiro@lifecalling.com", "Financeiro Carlos"),
        ]

        print("="*60)
        print("CORRIGINDO NOMES DE USUARIOS")
        print("="*60)

        for email, new_name in updates:
            user = db.query(User).filter(User.email == email).first()
            if user:
                old_name = user.name
                user.name = new_name
                print(f"[OK] {email}: '{old_name}' -> '{new_name}'")

        db.commit()
        print("\n[OK] Nomes atualizados!")

if __name__ == "__main__":
    fix_names()
