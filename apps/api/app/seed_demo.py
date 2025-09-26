from datetime import datetime
from app.db import SessionLocal
from app.models import User
from app.security import hash_password

DEMO = [
    ("Carlos Admin",       "admin@demo.local",      "admin"),
    ("Sara Supervisor",    "supervisor@demo.local", "supervisor"),
    ("Fábio Financeiro",   "financeiro@demo.local", "financeiro"),
    ("Cida Calculista",    "calculista@demo.local", "calculista"),
    ("Ana Atendente",      "atendente@demo.local",  "atendente"),
]

def upsert_user(name, email, role, password="123456"):
    with SessionLocal() as db:
        u = db.query(User).filter(User.email==email).first()
        if u:
            u.role = role
            db.commit()
            return
        u = User(
            name=name,
            email=email,
            role=role,
            password_hash=hash_password(password),
            created_at=datetime.utcnow(),
        )
        db.add(u); db.commit()

if __name__ == "__main__":
    for name,email,role in DEMO:
        upsert_user(name,email,role)
    print("Demo users ensured.")