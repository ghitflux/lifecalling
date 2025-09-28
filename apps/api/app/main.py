from fastapi import FastAPI
from .config import settings
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, cases, imports, ws as wsmod
from .routers import closing, finance, contracts
from .db import Base, engine
from .routers import simulations

app = FastAPI(title="Lifecalling API")

# Configuração CORS otimizada para desenvolvimento
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend dev e prod
    allow_credentials=True,  # CRÍTICO: necessário para cookies HttpOnly
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["Set-Cookie"],  # Expõe cookies para o frontend
)

# Routers
app.include_router(auth.r)
app.include_router(simulations.r)
app.include_router(cases.r)
app.include_router(closing.r)
app.include_router(finance.r)
app.include_router(contracts.r)
app.include_router(imports.r)
app.include_router(wsmod.ws_router)

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Lifecalling API está funcionando"}

# Debug endpoint para verificar dados
@app.get("/debug/cases")
def debug_cases():
    from .db import SessionLocal
    from .models import Case, Client
    with SessionLocal() as db:
        total_cases = db.query(Case).count()
        total_clients = db.query(Client).count()
        sample_case = db.query(Case).first()

        result = {
            "total_cases": total_cases,
            "total_clients": total_clients,
            "sample_case": None
        }

        if sample_case:
            result["sample_case"] = {
                "id": sample_case.id,
                "status": sample_case.status,
                "client_id": sample_case.client_id,
                "has_client": sample_case.client is not None,
                "created_at": str(sample_case.created_at)
            }

        return result

# Endpoint para limpar e recriar dados de teste
@app.post("/debug/reset-data")
def reset_test_data():
    from .db import SessionLocal
    from .models import Case, Client, User
    from datetime import datetime, timedelta
    import random

    BANCOS = ["Bradesco", "Itaú", "Caixa", "Banco do Brasil", "Santander"]
    ORGAOS = ["INSS", "Governo do Estado", "Prefeitura"]

    with SessionLocal() as db:
        try:
            # Limpar dados relacionados primeiro (devido a FK constraints)
            from .models import CaseEvent, Simulation, Attachment
            db.query(CaseEvent).delete()
            db.query(Simulation).delete()
            db.query(Attachment).delete()
            db.query(Case).delete()
            db.commit()

            # Buscar alguns clientes existentes ou criar novos
            clients = db.query(Client).limit(10).all()
            if not clients:
                # Criar alguns clientes se não existirem
                for i in range(5):
                    client = Client(
                        name=f"Cliente Teste {i+1}",
                        cpf=f"123.456.789-{i:02d}",
                        matricula=f"MAT{i+1:03d}",
                        orgao=random.choice(ORGAOS),
                        created_at=datetime.utcnow()
                    )
                    db.add(client)
                db.flush()
                clients = db.query(Client).limit(5).all()

            # Buscar usuários para atribuição
            users = db.query(User).all()

            # Criar casos limpos
            cases_created = 0
            for i in range(10):
                client = random.choice(clients)
                assigned_user = random.choice(users + [None, None])  # 2/3 chance de não ter usuário

                case = Case(
                    client_id=client.id,
                    status=random.choice(["novo", "em_atendimento", "calculista_pendente", "aprovado"]),
                    assigned_user_id=assigned_user.id if assigned_user else None,
                    banco=random.choice(BANCOS),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                    last_update_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
                )
                db.add(case)
                cases_created += 1

            db.commit()
            return {"message": f"✅ {cases_created} casos criados com sucesso", "total_clients": len(clients)}

        except Exception as e:
            db.rollback()
            return {"error": f"Erro ao resetar dados: {str(e)}"}

# Bootstrap DB (migrations via alembic, mas garantimos a existência)
Base.metadata.create_all(bind=engine)


