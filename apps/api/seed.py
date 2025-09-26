from app.db import SessionLocal
from app.models import User
from app.security import hash_password

users = [
  ("Carlos Admin","admin@demo.local","admin"),
  ("Sofia Supervisor","sup@demo.local","supervisor"),
  ("Felipe Financeiro","fin@demo.local","financeiro"),
  ("Caio Calculista","calc@demo.local","calculista"),
  ("Mica Atendente","aten@demo.local","atendente"),
]

with SessionLocal() as db:
  for name,email,role in users:
    if not db.query(User).filter_by(email=email).first():
      db.add(User(name=name,email=email,role=role,password_hash=hash_password("123456")))
  db.commit()
print("Seed ok")
