from app.db import SessionLocal
from app.models import User
from app.security import hash_password

db = SessionLocal()
admin = db.query(User).filter(User.email=='admin@lifecalling.com').first()

if admin:
    admin.password_hash = hash_password('test123')
    db.commit()
    print(f'Senha do admin atualizada para: test123')
    print(f'Email: {admin.email}')
    print(f'Role: {admin.role}')
else:
    print('Admin não encontrado')

db.close()