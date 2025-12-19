from app.db import SessionLocal
from app.models import User, MobileSimulation

db = SessionLocal()

users = db.query(User).all()
print(f'Total users: {len(users)}')
for u in users[:10]:
    print(f'  - {u.name} ({u.email}) - Role: {u.role}')

sims = db.query(MobileSimulation).all()
print(f'\nTotal simulations: {len(sims)}')
for s in sims[:5]:
    print(f'  - ID {s.id}: User {s.user_id}, Status: {s.status}')

db.close()
