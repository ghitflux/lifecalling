from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
from .routers import auth, cases, imports, ws as wsmod, clients, users, comments, admin, sla_audit, mobile

from .routers import closing, finance, dashboard, contract_attachments, analytics, rankings, campanhas, campaigns
from .db import Base, engine, sync_users_id_sequence
from .routers import simulations
from .routers.simulations import calculation_router
from .config import settings
import os

class UTF8JSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")

# Configurar timezone para Brasil (America/Sao_Paulo)
os.environ['TZ'] = 'America/Sao_Paulo'
try:
    import time
    time.tzset()
except AttributeError:
    # tzset não está disponível no Windows, mas a variável de ambiente ainda funciona
    pass

app = FastAPI(
    title="Lifecalling API",
    default_response_class=UTF8JSONResponse
)

# Parse FRONTEND_URL para suportar múltiplas URLs separadas por vírgula
frontend_urls = [url.strip() for url in settings.frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,  # CRÍTICO: necessário para cookies HttpOnly
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With", "X-CSRF-Token", "x-csrf-token"],
    expose_headers=["Set-Cookie"],  # Expõe cookies para o frontend
)

# Configuração do Scheduler de SLA
from .scheduler_config import init_scheduler, shutdown_scheduler

@app.on_event("startup")
async def startup_event():
    """Inicializa o scheduler de SLA no startup da aplicação"""
    sync_users_id_sequence()
    # Garante que o schema do módulo Life Mobile esteja atualizado (evita 500 em /mobile/simulations*)
    try:
        mobile.ensure_mobile_schema()
    except Exception as exc:
        print(f"[WARN] Could not ensure mobile schema: {exc}")
    init_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    """Desliga o scheduler gracefully no shutdown da aplicação"""
    shutdown_scheduler()

# Routers
app.include_router(auth.r)
app.include_router(admin.r)
app.include_router(rankings.r)
app.include_router(campanhas.r)
app.include_router(campaigns.r)
app.include_router(users.r)
app.include_router(simulations.r)
app.include_router(calculation_router)
app.include_router(cases.r)
app.include_router(closing.r)
app.include_router(finance.r)
app.include_router(contract_attachments.r)
app.include_router(dashboard.r)
app.include_router(analytics.r)

app.include_router(imports.r)
app.include_router(clients.r)
app.include_router(comments.r)
app.include_router(sla_audit.r)
app.include_router(wsmod.ws_router)
app.include_router(mobile.router)

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
                "last_update_at": str(sample_case.last_update_at)
            }

        return result

# Debug endpoint para testar filtros
@app.get("/debug/filters")
def debug_filters():
    from .db import SessionLocal
    from .models import Case, Client, PayrollLine
    from sqlalchemy import func, distinct
    
    with SessionLocal() as db:
        # Total de casos
        total_cases = db.query(Case).count()
        
        # Casos não atribuídos
        unassigned_cases = db.query(Case).filter(Case.assigned_user_id.is_(None)).count()
        
        # Entidades disponíveis
        entities = db.query(PayrollLine.entity_name).filter(
            PayrollLine.entity_name.isnot(None)
        ).distinct().all()
        entity_list = [e[0] for e in entities if e[0]]
        
        # Casos por entidade
        cases_by_entity = {}
        for entity in entity_list[:5]:  # Primeiras 5 entidades
            count = (
                db.query(func.count(distinct(Case.id)))
                .join(Client, Client.id == Case.client_id)
                .join(PayrollLine, PayrollLine.cpf == Client.cpf)
                .filter(PayrollLine.entity_name == entity)
                .scalar()
            )
            cases_by_entity[entity] = count
        
        # Casos não atribuídos por entidade
        unassigned_by_entity = {}
        for entity in entity_list[:5]:  # Primeiras 5 entidades
            count = (
                db.query(func.count(distinct(Case.id)))
                .join(Client, Client.id == Case.client_id)
                .join(PayrollLine, PayrollLine.cpf == Client.cpf)
                .filter(Case.assigned_user_id.is_(None))
                .filter(PayrollLine.entity_name == entity)
                .scalar()
            )
            unassigned_by_entity[entity] = count
        
        return {
            "total_cases": total_cases,
            "unassigned_cases": unassigned_cases,
            "entities": entity_list[:10],  # Primeiras 10 entidades
            "cases_by_entity": cases_by_entity,
            "unassigned_by_entity": unassigned_by_entity
        }

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
                    status=random.choice(["novo", "em_atendimento", "calculista_pendente", "calculo_aprovado"]),
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


@app.post("/debug/clear-all-data")
def clear_all_data():
    """Limpa todos os dados do banco - clients, cases, imports, etc."""
    from .db import SessionLocal
    from .models import (
        Case, Client, CaseEvent, Simulation, Attachment,
        ImportBatch, ImportRow, PayrollImportBatch, PayrollImportItem,
        PayrollClient, PayrollContract, Contract, ContractAttachment
    )

    with SessionLocal() as db:
        try:
            # Primeiro, limpar referências que podem ter FK
            from sqlalchemy import text
            db.execute(text("UPDATE cases SET last_simulation_id = NULL WHERE last_simulation_id IS NOT NULL"))

            # Limpar na ordem correta para evitar violações de FK
            db.query(CaseEvent).delete()
            db.query(Attachment).delete()
            db.query(Simulation).delete()

            # Import data
            db.query(ImportRow).delete()
            db.query(ImportBatch).delete()
            db.query(PayrollImportItem).delete()
            db.query(PayrollImportBatch).delete()

            # Contract attachments antes de contracts
            db.query(ContractAttachment).delete()

            # Contracts antes de cases (devido a FK)
            db.query(Contract).delete()
            db.query(PayrollContract).delete()

            # Cases depois de contracts
            db.query(Case).delete()

            # Clients por último
            db.query(Client).delete()
            db.query(PayrollClient).delete()

            db.commit()
            return {"message": "Todos os dados foram limpos com sucesso"}

        except Exception as e:
            db.rollback()
            return {"error": f"Erro ao limpar dados: {str(e)}"}


@app.post("/debug/clear-data-keep-users")
def clear_data_keep_users():
    """Limpa todos os dados do banco mantendo apenas os usuários."""
    from .db import SessionLocal
    from .models import (
        Case, Client, CaseEvent, Simulation, Attachment,
        ImportBatch, PayrollImportBatch, PayrollImportItem,
        PayrollClient, PayrollContract, Contract, ContractAttachment,
        Payment, FinanceExpense, FinanceIncome, PayrollLine,
        Import, ClientPhone, Campaign
    )

    with SessionLocal() as db:
        try:
            # Primeiro, limpar referências que podem ter FK
            from sqlalchemy import text
            db.execute(text("UPDATE cases SET last_simulation_id = NULL WHERE last_simulation_id IS NOT NULL"))
            db.execute(text("UPDATE cases SET assigned_user_id = NULL WHERE assigned_user_id IS NOT NULL"))

            # Limpar na ordem correta para evitar violações de FK
            # 1. Eventos e anexos de casos
            db.query(CaseEvent).delete()
            db.query(Attachment).delete()

            # 2. Simulações
            db.query(Simulation).delete()

            # 3. Pagamentos (dependem de contratos)
            db.query(Payment).delete()

            # 4. Anexos de contratos
            db.query(ContractAttachment).delete()

            # 5. Contratos (dependem de casos)
            db.query(Contract).delete()

            # 6. Casos (dependem de clientes)
            db.query(Case).delete()

            # 7. Telefones de clientes
            db.query(ClientPhone).delete()

            # 8. Clientes
            db.query(Client).delete()

            # 9. Dados de importação de folha
            db.query(PayrollImportItem).delete()
            db.query(PayrollImportBatch).delete()
            db.query(PayrollLine).delete()
            db.query(ImportBatch).delete()
            db.query(Import).delete()

            # 10. Clientes e contratos de folha
            db.query(PayrollContract).delete()
            db.query(PayrollClient).delete()

            # 11. Dados financeiros
            db.query(FinanceExpense).delete()
            db.query(FinanceIncome).delete()

            # 12. Campanhas
            db.query(Campaign).delete()

            db.commit()

            # Contar usuários restantes
            from .models import User
            user_count = db.query(User).count()

            return {
                "message": f"Dados limpos com sucesso! {user_count} usuários mantidos.",
                "users_kept": user_count
            }

        except Exception as e:
            db.rollback()
            return {"error": f"Erro ao limpar dados: {str(e)}"}


# Bootstrap DB (migrations via alembic, mas garantimos a existência)
Base.metadata.create_all(bind=engine)


