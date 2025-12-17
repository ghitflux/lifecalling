from app.db import SessionLocal
from app.models import User

db = SessionLocal()

# Atualizar clientes mobile existentes (criados com role 'atendente') para 'mobile_client'
mobile_emails = [
    "joao.silva@mobile.com",
    "maria.santos@mobile.com",
    "pedro.oliveira@mobile.com",
    "ana.costa@mobile.com",
    "carlos.souza@mobile.com",
]

print("Atualizando role dos clientes mobile...")
updated_count = 0

for email in mobile_emails:
    user = db.query(User).filter(User.email == email).first()
    if user:
        old_role = user.role
        user.role = "mobile_client"
        print(f"✅ {user.name} ({email}): {old_role} → mobile_client")
        updated_count += 1
    else:
        print(f"⚠️  {email} não encontrado")

db.commit()
print(f"\n✨ Total atualizado: {updated_count} clientes")

# Verificar resultado
mobile_clients = db.query(User).filter(User.role == "mobile_client").count()
print(f"📊 Total de clientes mobile no sistema: {mobile_clients}")

db.close()
