from app.db import SessionLocal
from app.models import Case, Client

db = SessionLocal()
test_client = db.query(Client).first()
if test_client:
    cases = db.query(Case).filter(Case.client_id == test_client.id).all()
    print(f'Client: {test_client.id} - {test_client.name}')
    print(f'Cases: {len(cases)}')
    for c in cases:
        print(f'  Case {c.id}: {c.status}')
else:
    print('No clients found')
db.close()
