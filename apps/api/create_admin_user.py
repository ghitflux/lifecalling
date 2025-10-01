"""
Cria usuário admin se não existir
"""
from app.db import SessionLocal
from app.models import User
from app.security import hash_password
from datetime import datetime

def create_admin():
    with SessionLocal() as db:
        # Verificar se já existe
        admin = db.query(User).filter(User.email == "admin@lifecalling.com").first()

        if admin:
            print(f"[OK] Usuario admin ja existe: {admin.name}")
            return admin

        # Criar admin
        admin = User(
            name="Admin",
            email="admin@lifecalling.com",
            password_hash=hash_password("admin123"),
            role="admin",
            active=True,
            created_at=datetime.utcnow()
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"[OK] Usuario admin criado: {admin.name}")
        print(f"    Email: {admin.email}")
        print(f"    Senha: admin123")

        return admin

if __name__ == "__main__":
    create_admin()
