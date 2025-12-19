from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_, and_, text, func
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import requests
import os
import re
import shutil
import uuid
from pathlib import Path
from ..db import SessionLocal, engine, sync_users_id_sequence
from ..models import User, MobileSimulation, MobileSimulationDocument, MobileNotification, Contract, now_brt
from ..security import get_current_user, hash_password
from decimal import Decimal

router = APIRouter(prefix="/mobile", tags=["mobile"])

# Roles autorizadas para área administrativa do Life Mobile
ADMIN_ROLES = {"admin", "supervisor", "atendente", "calculista", "super_admin"}

# Criar diretório para uploads se não existir
UPLOAD_DIR = Path("uploads/mobile_documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
# Schemas
class SimulationCreate(BaseModel):
    simulation_type: str
    requested_amount: float
    installments: int
    interest_rate: float

class SimulationResponse(BaseModel):
    id: str
    simulation_type: str
    requested_amount: float
    installments: int
    interest_rate: float
    installment_value: float
    total_amount: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Campos de análise (para exibir pendências no app do cliente)
    analysis_status: Optional[str] = None
    analyst_notes: Optional[str] = None
    pending_documents: Optional[List[dict]] = None
    analyzed_at: Optional[datetime] = None
    # New fields
    banks_json: Optional[List[dict]] = None
    prazo: Optional[int] = None
    coeficiente: Optional[str] = None
    seguro: Optional[float] = None
    percentual_consultoria: Optional[float] = None

    class Config:
        from_attributes = True

class MobileSimulationResponse(SimulationResponse):
    pass

class AdminSimulationResponse(SimulationResponse):
    user_id: int
    """
    Response para os endpoints administrativos com todos os detalhes
    necess��rios para o frontend.
    """
    user_name: str
    user_email: str
    # Dados complementares do cliente
    user_cpf: Optional[str] = None
    user_matricula: Optional[str] = None
    user_orgao: Optional[str] = None
    user_phone: Optional[str] = None
    # Alias esperados pelo frontend
    amount: Optional[float] = None  # Mesmo valor de requested_amount
    type: Optional[str] = None      # Mesmo valor de simulation_type
    # Campos de documento
    document_url: Optional[str] = None
    document_type: Optional[str] = None
    document_filename: Optional[str] = None
    # Campos de análise (necessários para transição de tabs no frontend)
    analysis_status: Optional[str] = None
    analyst_id: Optional[int] = None
    analyst_name: Optional[str] = None
    analyst_notes: Optional[str] = None
    pending_documents: Optional[List[dict]] = None
    analyzed_at: Optional[datetime] = None
    client_type: Optional[str] = None
    has_active_contract: Optional[bool] = None
class DocumentResponse(BaseModel):
    id: str
    document_type: Optional[str] = None
    document_filename: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDocumentItem(BaseModel):
    id: str
    document_type: Optional[str] = None
    document_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ContractBank(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None

class ContractProduct(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None

class ContractResponse(BaseModel):
    id: str
    status: str
    requested_amount: float
    total_amount: float
    installments: int
    installment_value: float
    interest_rate: float
    created_at: datetime
    disbursed_at: Optional[datetime] = None
    product: Optional[ContractProduct] = None
    bank: Optional[ContractBank] = None

class PushTokenRequest(BaseModel):
    token: str
    platform: Optional[str] = None
    device_id: Optional[str] = None

class MarginResponse(BaseModel):
    available_margin: float
    used_margin: float
    total_margin: float

# Helpers
def decimal_to_float(value):
    return float(value) if value is not None else None


def guess_media_type(file_ext: str | None) -> str:
    ext = (file_ext or "").lower().lstrip(".")
    if ext == "pdf":
        return "application/pdf"
    if ext in {"jpg", "jpeg"}:
        return "image/jpeg"
    if ext == "png":
        return "image/png"
    return "application/octet-stream"

_PUSH_TOKEN_TABLE_READY = False
def ensure_push_token_table():
    """
    Garante que a tabela de push tokens exista, sem depender de migração.
    """
    global _PUSH_TOKEN_TABLE_READY
    if _PUSH_TOKEN_TABLE_READY:
        return
    ddl = """
    CREATE TABLE IF NOT EXISTS mobile_push_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        platform VARCHAR(30),
        device_id VARCHAR(120),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        last_used_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_mobile_push_tokens_user_id ON mobile_push_tokens(user_id);
    """
    with engine.begin() as conn:
        conn.execute(text(ddl))
    _PUSH_TOKEN_TABLE_READY = True


def send_push_to_user(db: Session, user_id: int, title: str, body: str, data: dict | None = None) -> None:
    """
    Envia push notification via Expo para todos os tokens associados ao usuário.

    Importante: falhas de push não devem bloquear o fluxo do Life Mobile.
    """
    ensure_push_token_table()

    rows = db.execute(
        text("SELECT token FROM mobile_push_tokens WHERE user_id = :user_id ORDER BY last_used_at DESC"),
        {"user_id": user_id},
    ).all()

    tokens = [r[0] for r in rows if r and r[0]]
    if not tokens:
        return

    messages = [
        {
            "to": t,
            "sound": "default",
            "priority": "high",
            "channelId": "default",
            "title": title,
            "body": body,
            "data": data or {},
        }
        for t in tokens
    ]

    try:
        resp = requests.post(
            "https://exp.host/--/api/v2/push/send",
            json=messages,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        payload = resp.json() if resp.content else {}

        results = payload.get("data")
        if isinstance(results, dict):
            results = [results]

        if isinstance(results, list):
            tokens_to_delete: list[str] = []
            for token, result in zip(tokens, results):
                if not isinstance(result, dict):
                    continue
                if (result.get("status") or "").lower() != "error":
                    continue

                details = result.get("details") or {}
                error_code = details.get("error") or result.get("message")
                if error_code == "DeviceNotRegistered":
                    tokens_to_delete.append(token)
                else:
                    print(f"[WARN] Expo push error user_id={user_id}: {error_code}")

            if tokens_to_delete:
                for token in tokens_to_delete:
                    db.execute(text("DELETE FROM mobile_push_tokens WHERE token = :token"), {"token": token})
                db.commit()
    except Exception as exc:
        print(f"[WARN] Could not send Expo push: {exc}")

_MOBILE_SCHEMA_READY = False
def ensure_mobile_schema():
    """
    Garante que as tabelas/colunas do Life Mobile existam no banco (produção),
    evitando 500 por schema desatualizado (create_all não faz ALTER TABLE).
    """
    global _MOBILE_SCHEMA_READY
    if _MOBILE_SCHEMA_READY:
        return

    statements = [
        # Base tables (mínimo para funcionar mesmo sem migrations)
        """
        CREATE TABLE IF NOT EXISTS mobile_simulations (
            id VARCHAR(36) PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            simulation_type VARCHAR(50) NOT NULL,
            requested_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
            installments INTEGER NOT NULL DEFAULT 0,
            interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
            installment_value NUMERIC(14,2) NOT NULL DEFAULT 0,
            total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
        """,
        # Campos adicionados ao longo do tempo (migrations podem não ter rodado)
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS banks_json JSON",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS prazo INTEGER",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS coeficiente TEXT",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS seguro NUMERIC(14,2)",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS percentual_consultoria NUMERIC(5,2)",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS document_url TEXT",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS document_type VARCHAR(50)",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS document_filename TEXT",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS analysis_status VARCHAR(50) DEFAULT 'pending_analysis'",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS analyst_id INTEGER REFERENCES users(id)",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS analyst_notes TEXT",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS pending_documents JSON DEFAULT '[]'::json",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS client_type VARCHAR(20)",
        "ALTER TABLE mobile_simulations ADD COLUMN IF NOT EXISTS has_active_contract BOOLEAN DEFAULT FALSE",

        """
        CREATE TABLE IF NOT EXISTS mobile_simulation_documents (
            id VARCHAR(36) PRIMARY KEY,
            simulation_id VARCHAR(36) NOT NULL REFERENCES mobile_simulations(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            file_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT now()
        )
        """,
        "ALTER TABLE mobile_simulation_documents ADD COLUMN IF NOT EXISTS document_label VARCHAR(80)",
        "ALTER TABLE mobile_simulation_documents ADD COLUMN IF NOT EXISTS file_ext VARCHAR(10)",
        "ALTER TABLE mobile_simulation_documents ADD COLUMN IF NOT EXISTS original_filename TEXT",

        # Índices (performance)
        "CREATE INDEX IF NOT EXISTS ix_mobile_simulations_user_id ON mobile_simulations(user_id)",
        "CREATE INDEX IF NOT EXISTS ix_mobile_simulations_status ON mobile_simulations(status)",
        "CREATE INDEX IF NOT EXISTS ix_mobile_simulations_created_at ON mobile_simulations(created_at)",
        "CREATE INDEX IF NOT EXISTS ix_mobile_simulation_documents_user_created_at ON mobile_simulation_documents(user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_mobile_simulation_documents_simulation_id_created_at ON mobile_simulation_documents(simulation_id, created_at)",
    ]

    ok = True
    with engine.begin() as conn:
        for stmt in statements:
            try:
                conn.execute(text(stmt))
            except Exception as exc:
                ok = False
                preview = " ".join(str(stmt).split())[:140]
                print(f"[WARN] ensure_mobile_schema failed: {preview} ... ({exc})")

    if ok:
        _MOBILE_SCHEMA_READY = True

def generate_fake_cpf(user_id: int) -> str:
    """Gera um CPF fictício determinístico a partir do ID do usuário (11 dígitos)."""
    return str(10000000000 + user_id)[-11:]

def generate_fake_phone(user_id: int) -> str:
    """Gera um número de WhatsApp fictício com DDI/DDD."""
    return f"+5511{str(900000000 + user_id)[-9:]}"

def serialize_admin_simulation(sim: MobileSimulation) -> dict:
    """Serializa uma MobileSimulation para o formato esperado pelo frontend admin."""
    status_value = sim.status or ("pending" if sim.document_url else sim.status)
    status_lower = (status_value or "").lower()

    # Normaliza status de análise ausente APENAS para itens realmente em análise
    analysis_value = sim.analysis_status
    if not analysis_value and sim.document_url and (not status_lower or status_lower in {"pending", "simulation_requested"}):
        analysis_value = "pending_analysis"
    fake_cpf = generate_fake_cpf(sim.user_id)
    fake_phone = generate_fake_phone(sim.user_id)
    return {
        "user_id": sim.user_id,
        "id": sim.id,
        "simulation_type": sim.simulation_type,
        "type": sim.simulation_type,
        "requested_amount": decimal_to_float(sim.requested_amount),
        "amount": decimal_to_float(sim.requested_amount),
        "installments": sim.installments,
        "interest_rate": decimal_to_float(sim.interest_rate),
        "installment_value": decimal_to_float(sim.installment_value),
        "total_amount": decimal_to_float(sim.total_amount),
        "status": status_value,
        "created_at": sim.created_at,
        "updated_at": getattr(sim, "updated_at", None),
        "banks_json": sim.banks_json or [],
        "prazo": sim.prazo,
        "coeficiente": sim.coeficiente,
        "seguro": decimal_to_float(sim.seguro),
        "percentual_consultoria": decimal_to_float(sim.percentual_consultoria),
        "user_name": sim.user.name,
        "user_email": sim.user.email,
        "user_cpf": getattr(sim.user, "cpf", None) or fake_cpf,
        "user_matricula": getattr(sim.user, "matricula", None),
        "user_orgao": getattr(sim.user, "orgao", None),
        "user_phone": getattr(sim.user, "phone", None) or fake_phone,
        "document_url": sim.document_url,
        "document_type": sim.document_type,
        "document_filename": sim.document_filename,
        # Campos de análise
        "analysis_status": analysis_value,
        "analyst_id": sim.analyst_id,
        "analyst_name": sim.analyst.name if sim.analyst else None,
        "analyst_notes": sim.analyst_notes,
        "pending_documents": sim.pending_documents or [],
        "analyzed_at": sim.analyzed_at,
        "client_type": sim.client_type,
        "has_active_contract": sim.has_active_contract,
    }

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/push-token")
async def debug_push_tokens(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna tokens do usuário (útil para debug/teste).
    """
    ensure_push_token_table()
    rows = db.execute(
        text(
            """
            SELECT token, platform, device_id, created_at, updated_at, last_used_at
            FROM mobile_push_tokens
            WHERE user_id = :user_id
            ORDER BY updated_at DESC
            """
        ),
        {"user_id": current_user.id}
    ).fetchall()
    return [
        {
            "token": r.token,
            "platform": r.platform,
            "device_id": r.device_id,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "last_used_at": r.last_used_at,
        }
        for r in rows
    ]

# ======================
# PUBLIC ENDPOINTS (sem autenticação - para cadastro inicial no app)
# ======================

class ClientRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    cpf: Optional[str] = None
    phone: Optional[str] = None
    consent_credit_simulation: bool

class ClientRegisterResponse(BaseModel):
    id: int
    name: str
    email: str
    message: str

@router.post("/register", response_model=ClientRegisterResponse, status_code=201)
async def register_mobile_client(
    client_data: ClientRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registra um novo cliente mobile.
    Este endpoint NÃO requer autenticação pois é usado no cadastro inicial do app.
    O cliente é criado no sistema web automaticamente.
    """
    name = (client_data.name or "").strip()
    email = (client_data.email or "").strip().lower()
    cpf = (client_data.cpf or "").strip() or None
    phone = (client_data.phone or "").strip() or None

    if not name or not email:
        raise HTTPException(status_code=400, detail="Nome e email são obrigatórios")

    if cpf and len(cpf) > 14:
        raise HTTPException(status_code=400, detail="CPF inválido")

    if phone and len(phone) > 20:
        raise HTTPException(status_code=400, detail="Telefone inválido")

    if not client_data.consent_credit_simulation:
        raise HTTPException(
            status_code=400,
            detail="Consentimento obrigatório para simulação de crédito",
        )

    # Verificar se email já existe (case-insensitive)
    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    def build_user() -> User:
        return User(
            name=name,
            email=email,
            password_hash=hash_password(client_data.password),
            cpf=cpf,
            phone=phone,
            role="mobile_client",  # Role específica para clientes mobile
            active=True,
        )

    # Criar novo usuário com role 'mobile_client'
    new_user = build_user()
    try:
        db.add(new_user)
        db.commit()
    except IntegrityError as exc:
        db.rollback()

        constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        if constraint_name == "users_email_key":
            raise HTTPException(status_code=400, detail="Email já cadastrado")

        # Se a sequence estiver fora de sincronia (pós-restore/seed), corrigir e tentar 1 vez.
        if constraint_name == "users_pkey":
            sync_users_id_sequence()
            new_user = build_user()
            try:
                db.add(new_user)
                db.commit()
            except IntegrityError:
                db.rollback()
                raise HTTPException(status_code=500, detail="Erro ao criar conta. Tente novamente.")
        else:
            raise HTTPException(status_code=500, detail="Erro ao criar conta. Tente novamente.")

    db.refresh(new_user)
    
    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "message": "Cliente registrado com sucesso! Você já pode fazer login."
    }

# ======================
# AUTHENTICATED ENDPOINTS
# ======================

@router.post("/simulations/upload", status_code=201)
async def create_simulation_with_document(
    document: UploadFile = File(...),
    simulation_type: str = Form("document_upload"),
    document_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cria uma simulação a partir do upload de um documento (foto ou PDF).
    O arquivo é salvo e a simulação é criada com status 'pending' para análise no sistema web.
    """
    
    # Validar tipo de arquivo
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.pdf'}
    file_ext = os.path.splitext(document.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(allowed_extensions)}"
        )

    label = (document_type or "").strip() or file_ext.lstrip(".")
    
    # Gerar nome único para o arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    safe_filename = f"{current_user.id}_{timestamp}_{uuid.uuid4().hex}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(document.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
    
    # Descobrir tipo de cliente (novo ou recontratação) para sinalizar SLA correto
    client_status = check_client_status(db, current_user.id, getattr(current_user, "cpf", None))

    # Criar simulação com documento anexado
    # Reaproveitar simulação aberta (evitar múltiplos cards)
    open_sim = (
        db.query(MobileSimulation)
        .filter(
            MobileSimulation.user_id == current_user.id,
            MobileSimulation.status.notin_(["rejected", "financeiro_cancelado", "contrato_efetivado"]),
        )
        .order_by(MobileSimulation.created_at.desc())
        .first()
    )

    if open_sim:
        # Preserva documento atual (histórico) antes de atualizar o "último documento"
        if open_sim.document_url:
            existing_doc = (
                db.query(MobileSimulationDocument)
                .filter(
                    MobileSimulationDocument.simulation_id == open_sim.id,
                    MobileSimulationDocument.file_path == open_sim.document_url,
                )
                .first()
            )
            if not existing_doc:
                legacy_created_at = getattr(open_sim, "updated_at", None) or getattr(open_sim, "created_at", None) or now_brt()
                db.add(
                    MobileSimulationDocument(
                        simulation_id=open_sim.id,
                        user_id=current_user.id,
                        document_label=(open_sim.document_type or "").strip() or None,
                        file_path=open_sim.document_url,
                        file_ext=(open_sim.document_type or "").strip().lower() or None,
                        original_filename=open_sim.document_filename,
                        created_at=legacy_created_at,
                    )
                )

        # Adiciona novo anexo (não substitui)
        db.add(
            MobileSimulationDocument(
                simulation_id=open_sim.id,
                user_id=current_user.id,
                document_label=label,
                file_path=str(file_path),
                file_ext=file_ext.lstrip("."),
                original_filename=document.filename,
            )
        )

        # Mantém compatibilidade: campos no MobileSimulation apontam para o último documento
        open_sim.document_url = str(file_path)
        open_sim.document_type = file_ext.lstrip(".")
        open_sim.document_filename = document.filename
        is_pendency_return = (open_sim.status or "").lower() in {"pending_docs", "retorno_pendencia"} or (
            (open_sim.analysis_status or "").lower() in {"pending_docs", "retorno_pendencia"}
        )
        open_sim.simulation_type = open_sim.simulation_type or simulation_type

        if is_pendency_return:
            open_sim.status = "retorno_pendencia"
            open_sim.analysis_status = "retorno_pendencia"
        else:
            open_sim.analysis_status = "pending_analysis"
            if not open_sim.status:
                open_sim.status = "pending"
        db.commit()
        db.refresh(open_sim)

        return {
            "simulation_id": open_sim.id,
            "status": open_sim.status,
            "analysis_status": open_sim.analysis_status,
            "client_type": open_sim.client_type,
            "has_active_contract": open_sim.has_active_contract,
            "message": "Documento atualizado! Sua solicitação segue em análise.",
            "document_filename": document.filename
        }

    # Caso não exista simulação aberta, cria uma nova
    new_simulation = MobileSimulation(
        user_id=current_user.id,
        simulation_type=simulation_type,
        requested_amount=0,  # Será preenchido pelo admin no sistema web
        installments=0,
        interest_rate=0,
        installment_value=0,
        total_amount=0,
        status="pending",
        analysis_status="pending_analysis",
        document_url=str(file_path),
        document_type=file_ext.lstrip("."),
        document_filename=document.filename,
        client_type=client_status["client_type"],
        has_active_contract=client_status["has_active_contract"]
    )
    
    db.add(new_simulation)
    db.flush()
    db.add(
        MobileSimulationDocument(
            simulation_id=new_simulation.id,
            user_id=current_user.id,
            document_label=label,
            file_path=str(file_path),
            file_ext=file_ext.lstrip("."),
            original_filename=document.filename,
        )
    )
    db.commit()
    db.refresh(new_simulation)
    
    return {
        "simulation_id": new_simulation.id,
        "status": "pending",
        "analysis_status": new_simulation.analysis_status,
        "client_type": new_simulation.client_type,
        "has_active_contract": new_simulation.has_active_contract,
        "message": "Documento enviado com sucesso! Sua simulação está em análise.",
        "document_filename": document.filename
    }

@router.post("/simulations", response_model=SimulationResponse, status_code=201)
async def create_simulation(
    simulation_data: SimulationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate values
    monthly_rate = Decimal(str(simulation_data.interest_rate)) / 100
    requested_amount = Decimal(str(simulation_data.requested_amount))
    
    # Formula: PMT = PV * i * (1 + i)^n / ((1 + i)^n - 1)
    if monthly_rate > 0:
        installment_value = (
            requested_amount * monthly_rate *
            (1 + monthly_rate) ** simulation_data.installments
        ) / ((1 + monthly_rate) ** simulation_data.installments - 1)
    else:
        installment_value = requested_amount / simulation_data.installments

    total_amount = installment_value * simulation_data.installments

    new_simulation = MobileSimulation(
        user_id=current_user.id,
        simulation_type=simulation_data.simulation_type,
        requested_amount=requested_amount,
        installments=simulation_data.installments,
        interest_rate=Decimal(str(simulation_data.interest_rate)),
        installment_value=round(installment_value, 2),
        total_amount=round(total_amount, 2),
        status="pending"
    )

    db.add(new_simulation)
    db.commit()
    db.refresh(new_simulation)

    return new_simulation

@router.get("/simulations", response_model=List[SimulationResponse])
async def get_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(MobileSimulation).filter(
        MobileSimulation.user_id == current_user.id
    ).order_by(MobileSimulation.created_at.desc()).all()

@router.get("/contracts", response_model=List[ContractResponse])
async def get_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Lista contratos mobile do usuário (baseado nas simulações mobile já aprovadas ou efetivadas).
    """
    sims = (
        db.query(MobileSimulation)
        .filter(MobileSimulation.user_id == current_user.id)
        .order_by(MobileSimulation.created_at.desc())
        .all()
    )

    contracts = []
    for sim in sims:
        banks = sim.banks_json if isinstance(sim.banks_json, list) else []
        first_bank = banks[0] if banks else {}

        bank_name = None
        if isinstance(first_bank, dict):
            bank_name = first_bank.get("bank") or first_bank.get("banco") or first_bank.get("entidade") or first_bank.get("entidade_nome")
            product_name = first_bank.get("product") or first_bank.get("produto") or first_bank.get("name")
            bank_id = first_bank.get("bank_id") or first_bank.get("id")
            product_id = first_bank.get("product_id")
        else:
            product_name = None
            bank_id = None
            product_id = None

        contracts.append({
            "id": sim.id,
            "status": sim.status,
            "requested_amount": decimal_to_float(sim.requested_amount) or 0.0,
            "total_amount": decimal_to_float(sim.total_amount) or 0.0,
            "installments": sim.installments or 0,
            "installment_value": decimal_to_float(sim.installment_value) or 0.0,
            "interest_rate": decimal_to_float(sim.interest_rate) or 0.0,
            "created_at": sim.created_at,
            "disbursed_at": sim.analyzed_at if sim.status == "contrato_efetivado" else None,
            "product": {"id": str(product_id)} if product_id else ({"name": product_name} if product_name else None),
            "bank": {"id": str(bank_id)} if bank_id else ({"name": bank_name} if bank_name else None),
        })

    return contracts

@router.post("/push-token")
async def save_push_token(
    payload: PushTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Salva ou atualiza o push token do usuário (Expo).
    """
    ensure_push_token_table()

    token = (payload.token or "").strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token inválido")

    now_ts = now_brt()

    existing = db.execute(
        text("SELECT id FROM mobile_push_tokens WHERE token = :token"),
        {"token": token}
    ).first()

    if existing:
        db.execute(
            text(
                """
                UPDATE mobile_push_tokens
                SET user_id = :user_id,
                    platform = :platform,
                    device_id = :device_id,
                    updated_at = :updated_at,
                    last_used_at = :last_used_at
                WHERE id = :id
                """
            ),
            {
                "id": existing.id,
                "user_id": current_user.id,
                "platform": payload.platform,
                "device_id": payload.device_id,
                "updated_at": now_ts,
                "last_used_at": now_ts,
            }
        )
    else:
        db.execute(
            text(
                """
                INSERT INTO mobile_push_tokens
                    (user_id, token, platform, device_id, created_at, updated_at, last_used_at)
                VALUES
                    (:user_id, :token, :platform, :device_id, :created_at, :updated_at, :last_used_at)
                """
            ),
            {
                "user_id": current_user.id,
                "token": token,
                "platform": payload.platform,
                "device_id": payload.device_id,
                "created_at": now_ts,
                "updated_at": now_ts,
                "last_used_at": now_ts,
            }
        )

    db.commit()

    return {
        "ok": True,
        "token": token,
        "platform": payload.platform,
        "device_id": payload.device_id,
    }

@router.post("/simulations/{simulation_id}/approve-by-client", response_model=SimulationResponse)
async def approve_simulation_by_client(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sim = db.query(MobileSimulation).filter(
        MobileSimulation.id == simulation_id,
        MobileSimulation.user_id == current_user.id
    ).first()

    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # O cliente só pode aprovar quando a proposta estiver disponível no app
    # (após o calculista gerar a simulação e o admin enviá-la para o cliente).
    allowed_statuses = {"approved", "simulacao_aprovada"}
    if (sim.status or "").lower() not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Proposta ainda não disponível para aprovação")

    sim.status = "approved_by_client"
    sim.analysis_status = None
    sim.updated_at = now_brt()
    db.commit()
    db.refresh(sim)
    create_notification(
        db,
        current_user.id,
        "Simulação aprovada",
        "Você aprovou a simulação. O agente responsável entrará em contato para finalizar o contrato.",
        "success",
        push=False,
    )
    return sim

@router.post("/simulations/{simulation_id}/reject-by-client", response_model=SimulationResponse)
async def reject_simulation_by_client(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sim = db.query(MobileSimulation).filter(
        MobileSimulation.id == simulation_id,
        MobileSimulation.user_id == current_user.id
    ).first()

    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    allowed_statuses = {"approved", "simulacao_aprovada"}
    if (sim.status or "").lower() not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Proposta ainda não disponível para reprovação")

    sim.status = "rejected"
    db.commit()
    db.refresh(sim)
    create_notification(
        db,
        current_user.id,
        "Simulação rejeitada",
        "Você rejeitou esta simulação.",
        "warning",
        push=False,
    )
    return sim

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista documentos enviados pelo cliente (mantém histórico de anexos)."""

    rows = (
        db.query(MobileSimulationDocument, MobileSimulation.status)
        .join(MobileSimulation, MobileSimulation.id == MobileSimulationDocument.simulation_id)
        .filter(MobileSimulationDocument.user_id == current_user.id)
        .order_by(MobileSimulationDocument.created_at.desc())
        .all()
    )

    items = [
        {
            "id": doc.id,
            "document_type": doc.document_label or doc.file_ext,
            "document_filename": doc.original_filename,
            "status": sim_status,
            "created_at": doc.created_at,
        }
        for doc, sim_status in rows
    ]

    # Compatibilidade: simulações antigas com documento, mas sem histórico registrado
    sim_ids_with_docs = {doc.simulation_id for doc, _ in rows}
    legacy_query = db.query(MobileSimulation).filter(
        MobileSimulation.user_id == current_user.id,
        MobileSimulation.document_url.isnot(None),
    )
    if sim_ids_with_docs:
        legacy_query = legacy_query.filter(~MobileSimulation.id.in_(sim_ids_with_docs))

    legacy_sims = legacy_query.order_by(MobileSimulation.created_at.desc()).all()
    for sim in legacy_sims:
        items.append(
            {
                "id": sim.id,
                "document_type": sim.document_type,
                "document_filename": sim.document_filename,
                "status": sim.status,
                "created_at": sim.created_at,
            }
        )

    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items

@router.get("/documents/{doc_id}")
async def download_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download de documento do próprio cliente (suporta histórico)."""

    doc = (
        db.query(MobileSimulationDocument)
        .filter(
            MobileSimulationDocument.id == doc_id,
            MobileSimulationDocument.user_id == current_user.id,
        )
        .first()
    )
    if doc:
        return FileResponse(
            path=doc.file_path,
            filename=doc.original_filename,
            media_type=guess_media_type(doc.file_ext),
        )

    # Compatibilidade com registros antigos: doc_id = simulation_id
    simulation = db.query(MobileSimulation).filter(
        MobileSimulation.id == doc_id,
        MobileSimulation.user_id == current_user.id,
    ).first()

    if not simulation:
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    if not simulation.document_url:
        raise HTTPException(status_code=404, detail="Nenhum documento anexado a esta simulação")

    return FileResponse(
        path=simulation.document_url,
        filename=simulation.document_filename,
        media_type=guess_media_type(simulation.document_type),
    )

@router.get("/margins/current", response_model=MarginResponse)
async def get_current_margin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock implementation - in a real scenario this would come from payroll data
    # For now returning static values as requested to not break existing logic
    return {
        "available_margin": 1500.00,
        "used_margin": 3500.00,
        "total_margin": 5000.00
    }

@router.get("/profile")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role
    }

# Admin Endpoints

class AdminClientResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    cpf: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class MobileSimulationCreateAdmin(BaseModel):
    user_id: int
    simulation_type: str
    requested_amount: float
    installments: int
    interest_rate: float
    installment_value: float
    total_amount: float
    # New fields for multi-bank
    banks_json: Optional[List[dict]] = None
    prazo: Optional[int] = None
    coeficiente: Optional[str] = None
    seguro: Optional[float] = None
    percentual_consultoria: Optional[float] = None

class MobileSimulationUpdateAdmin(BaseModel):
    simulation_type: Optional[str] = None
    requested_amount: Optional[float] = None
    installments: Optional[int] = None
    interest_rate: Optional[float] = None
    installment_value: Optional[float] = None
    total_amount: Optional[float] = None
    banks_json: Optional[List[dict]] = None
    prazo: Optional[int] = None
    coeficiente: Optional[str] = None
    seguro: Optional[float] = None
    percentual_consultoria: Optional[float] = None

# Schemas para análise de simulações
class PendingDocumentRequest(BaseModel):
    type: str  # Ex: "rg", "cpf", "comprovante_renda"
    description: str  # Ex: "Enviar RG frente e verso"

class PendSimulationRequest(BaseModel):
    analyst_notes: str
    pending_documents: List[PendingDocumentRequest]

class ReproveSimulationRequest(BaseModel):
    analyst_notes: str

class ApproveForCalculationRequest(BaseModel):
    analyst_notes: Optional[str] = None

@router.get("/admin/clients", response_model=List[AdminClientResponse])
async def get_admin_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # CORRIGIDO: Retornar APENAS clientes mobile (role = 'mobile_client')
    mobile_clients = db.query(User).filter(
        User.role == "mobile_client",
        User.active == True
    ).order_by(User.created_at.desc()).all()

    # Serializar dados extras esperados pelo frontend (cpf/phone são opcionais)
    return [
        {
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "role": client.role,
            "created_at": client.created_at,
            "cpf": getattr(client, "cpf", None) or generate_fake_cpf(client.id),
            "phone": getattr(client, "phone", None) or generate_fake_phone(client.id),
        }
        for client in mobile_clients
    ]


@router.delete("/admin/clients/{client_id}")
async def delete_admin_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Exclusão administrativa de clientes mobile.

    Regra: remove o acesso (inativa/anônima) sem apagar dados do sistema web.
    """
    # Apenas admin/super_admin podem excluir
    if current_user.role not in {"admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Acesso negado")

    client = (
        db.query(User)
        .filter(User.id == client_id, User.role == "mobile_client")
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Cliente mobile não encontrado")

    # Remover simulações e documentos vinculados ao cliente
    simulation_ids = [
        row[0]
        for row in db.query(MobileSimulation.id)
        .filter(MobileSimulation.user_id == client.id)
        .all()
    ]
    if simulation_ids:
        db.query(MobileSimulationDocument).filter(
            MobileSimulationDocument.simulation_id.in_(simulation_ids)
        ).delete(synchronize_session=False)
        db.query(MobileSimulation).filter(
            MobileSimulation.id.in_(simulation_ids)
        ).delete(synchronize_session=False)

    # Anonimiza e inativa para:
    # - impedir login
    # - permitir que o usuário se recadastre com o mesmo email futuramente
    now_ts = now_brt()
    client.active = False
    client.name = f"Cliente Excluído ({client.id})"
    client.email = f"deleted+{client.id}+{int(now_ts.timestamp())}@example.invalid"
    client.cpf = None
    client.phone = None
    client.password_hash = hash_password(str(uuid.uuid4()))

    # Remover push tokens do cliente excluído
    try:
        ensure_push_token_table()
        db.execute(
            text("DELETE FROM mobile_push_tokens WHERE user_id = :user_id"),
            {"user_id": client.id},
        )
    except Exception:
        pass

    db.commit()

    return {"ok": True, "id": client_id}

@router.get("/admin/simulations", response_model=List[AdminSimulationResponse])
async def get_admin_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Join with User to get client details
    simulations = (
        db.query(MobileSimulation)
        .options(selectinload(MobileSimulation.user))
        .join(User, MobileSimulation.user_id == User.id)
        .order_by(MobileSimulation.updated_at.desc(), MobileSimulation.created_at.desc())
        .all()
    )
    return [serialize_admin_simulation(sim) for sim in simulations]

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    type: str = "info",
    *,
    push: bool = True,
    push_data: dict | None = None,
):
    notif = MobileNotification(
        user_id=user_id,
        title=title,
        message=message,
        type=type,
        created_at=now_brt()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    if push:
        try:
            data = dict(push_data or {})
            data.setdefault("notificationId", str(notif.id))
            send_push_to_user(db, user_id, title, message, data=data)
        except Exception as exc:
            print(f"[WARN] Could not send mobile push: {exc}")

    return notif

@router.post("/admin/simulations", response_model=AdminSimulationResponse)
def create_admin_simulation(
    simulation: MobileSimulationCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Verify target user exists
    target_user = db.query(User).filter(User.id == simulation.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_simulation = MobileSimulation(
        user_id=simulation.user_id,
        simulation_type=simulation.simulation_type,
        requested_amount=simulation.requested_amount,
        installments=simulation.installments,
        interest_rate=simulation.interest_rate,
        installment_value=simulation.installment_value,
        total_amount=simulation.total_amount,
        status="pending",
        # New fields
        banks_json=simulation.banks_json,
        prazo=simulation.prazo,
        coeficiente=simulation.coeficiente,
        seguro=simulation.seguro,
        percentual_consultoria=simulation.percentual_consultoria
    )
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)
    return serialize_admin_simulation(db_simulation)

@router.put("/admin/simulations/{simulation_id}", response_model=AdminSimulationResponse)
def update_admin_simulation(
    simulation_id: str,
    payload: MobileSimulationUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")

    sim = db.query(MobileSimulation).options(selectinload(MobileSimulation.user)).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Atualiza campos informados
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(sim, field, value)

    # Mantém status como pending até que o admin aprove explicitamente
    # A notificação será criada apenas quando aprovar via botão "Enviar/Aprovar no App"

    db.commit()
    db.refresh(sim)
    return serialize_admin_simulation(sim)


@router.post("/admin/simulations/{simulation_id}/set-latest", response_model=AdminSimulationResponse)
def set_admin_simulation_latest(
    simulation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marca a simulação como "mais recente" atualizando `updated_at`.

    Útil para promover uma simulação antiga no histórico sem precisar recalcular.
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Not authorized")

    sim = (
        db.query(MobileSimulation)
        .options(selectinload(MobileSimulation.user))
        .filter(MobileSimulation.id == simulation_id)
        .first()
    )
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    sim.updated_at = now_brt()
    db.commit()
    db.refresh(sim)
    return serialize_admin_simulation(sim)

@router.get("/admin/simulations/analysis")
async def get_simulations_for_analysis(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna simulações pendentes de análise.
    Automaticamente verifica o tipo de cliente (novo ou com contrato ativo).
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    # Buscar simulações com status de análise pendente
    simulations = (
        db.query(MobileSimulation)
        .options(selectinload(MobileSimulation.user), selectinload(MobileSimulation.analyst))
        .filter(
            or_(
                MobileSimulation.analysis_status.in_(["pending_analysis", "pending_docs"]),
                and_(
                    MobileSimulation.analysis_status.is_(None),
                    MobileSimulation.status.in_(["pending", "simulation_requested"])
                )
            )
        )
        .order_by(MobileSimulation.created_at.desc())
        .all()
    )

    # Atualizar informações de tipo de cliente automaticamente
    for sim in simulations:
        # Normaliza análise para registros antigos sem analysis_status
        if not sim.analysis_status and sim.document_url:
            sim.analysis_status = "pending_analysis"
            if not sim.status:
                sim.status = "pending"

        # Se ainda não tiver analysis_status, mas estiver em pending/simulation_requested, force pending_analysis para análise
        if not sim.analysis_status and sim.status and sim.status.lower() in {"pending", "simulation_requested"}:
            sim.analysis_status = "pending_analysis"

        if not sim.client_type:
            client_status = check_client_status(db, sim.user_id, getattr(sim.user, "cpf", None))
            sim.client_type = client_status["client_type"]
            sim.has_active_contract = client_status["has_active_contract"]

    db.commit()

    return [serialize_admin_simulation(sim) for sim in simulations]

@router.get("/admin/simulations/{simulation_id}", response_model=AdminSimulationResponse)
async def get_admin_simulation_by_id(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Eager load user and analyst details
    sim = (
        db.query(MobileSimulation)
        .options(
            selectinload(MobileSimulation.user),
            selectinload(MobileSimulation.analyst)
        )
        .filter(MobileSimulation.id == simulation_id)
        .first()
    )
    
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    
    return serialize_admin_simulation(sim)

@router.post("/admin/simulations/{simulation_id}/approve")
async def approve_simulation(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Verificar se o cliente já aprovou
    client_approved_statuses = ["approved_by_client", "cliente_aprovada", "simulacao_aprovada"]
    status_lower = (sim.status or "").lower()
    analysis_status_lower = (sim.analysis_status or "").lower()
    banks_data = sim.banks_json
    if isinstance(banks_data, list):
        has_calculation = len(banks_data) > 0
    else:
        has_calculation = bool(banks_data)

    if status_lower in client_approved_statuses:
        # Cliente já aprovou, enviar direto para o financeiro
        sim.status = "financeiro_pendente"
        sim.analysis_status = None
        create_notification(
            db,
            sim.user_id,
            "Proposta enviada ao financeiro",
            "Sua simulação foi aprovada e enviada ao setor financeiro para processamento.",
            "success",
            push_data={"type": "simulation", "simulationId": sim.id},
        )
        message = "Simulação enviada ao financeiro com sucesso"
    elif status_lower == "approved_for_calculation":
        # Já passou pela análise, só pode seguir se a simulação estiver montada
        if not has_calculation:
            raise HTTPException(
                status_code=400,
                detail="Simulação ainda não calculada pelo time de cálculo."
            )
        sim.status = "approved"
        sim.analysis_status = None
        create_notification(
            db,
            sim.user_id,
            "Nova proposta disponível",
            "Sua simulação foi aprovada e aguarda sua confirmação.",
            "info",
            push_data={"type": "simulation", "simulationId": sim.id},
        )
        message = "Simulação aprovada e enviada para o cliente"
    elif status_lower in {"pending", "simulation_requested", ""} or analysis_status_lower in {"pending_analysis", "pending_docs"}:
        # Aprovação inicial do analista: mandar para o calculista (Em simulação)
        if has_calculation:
            # Se já existir cálculo pronto, pode seguir para o cliente
            sim.status = "approved"
            sim.analysis_status = None
            create_notification(
                db,
                sim.user_id,
                "Nova proposta disponível",
                "Sua simulação foi aprovada e aguarda sua confirmação.",
                "info",
                push_data={"type": "simulation", "simulationId": sim.id},
            )
            message = "Simulação aprovada e enviada para o cliente"
        else:
            sim.analysis_status = "approved_for_calculation"
            sim.status = "approved_for_calculation"
            sim.analyst_id = current_user.id
            sim.analyzed_at = now_brt()
            create_notification(
                db,
                sim.user_id,
                "Análise Aprovada",
                "Sua simulação foi aprovada e está sendo processada pelo nosso calculista.",
                "success",
                push_data={"type": "simulation", "simulationId": sim.id},
            )
            message = "Simulação aprovada para cálculo"
    else:
        # Primeira aprovação do admin, aguardando aprovação do cliente no app
        sim.status = "approved"
        sim.analysis_status = None
        create_notification(
            db,
            sim.user_id,
            "Nova proposta disponível",
            "Sua simulação foi aprovada e aguarda sua confirmação.",
            "info",
            push_data={"type": "simulation", "simulationId": sim.id},
        )
        message = "Simulação aprovada e enviada para o cliente"

    db.commit()
    return {"message": message}

@router.post("/admin/simulations/{simulation_id}/reject")
async def reject_simulation(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    sim.status = "rejected"

    # Criar notificação para o cliente
    create_notification(
        db,
        sim.user_id,
        "Proposta reprovada",
        "Sua simulação foi reprovada. Entre em contato para mais informações.",
        "error",
        push_data={"type": "simulation", "simulationId": sim.id},
    )

    db.commit()
    return {"message": "Simulação reprovada com sucesso"}

@router.get("/admin/simulations/{simulation_id}/documents", response_model=List[AdminDocumentItem])
async def list_simulation_documents_admin(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista anexos enviados pelo cliente (histórico) para uma simulação."""
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    docs = (
        db.query(MobileSimulationDocument)
        .filter(MobileSimulationDocument.simulation_id == simulation_id)
        .order_by(MobileSimulationDocument.created_at.desc())
        .all()
    )
    if docs:
        return [
            {
                "id": doc.id,
                "document_type": doc.document_label or doc.file_ext,
                "document_filename": doc.original_filename,
                "created_at": doc.created_at,
            }
            for doc in docs
        ]

    # Compatibilidade: simulações antigas com um único documento no registro
    simulation = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    if not simulation.document_url:
        return []

    return [
        {
            "id": simulation.id,
            "document_type": simulation.document_type,
            "document_filename": simulation.document_filename,
            "created_at": simulation.created_at,
        }
    ]


@router.get("/admin/documents/{doc_id}")
async def get_simulation_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download de documento (suporta histórico)."""
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    doc = db.query(MobileSimulationDocument).filter(MobileSimulationDocument.id == doc_id).first()
    if doc:
        return FileResponse(
            path=doc.file_path,
            filename=doc.original_filename,
            media_type=guess_media_type(doc.file_ext),
        )
    
    simulation = db.query(MobileSimulation).filter(
        MobileSimulation.id == doc_id
    ).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Documento não encontrado")
    
    if not simulation.document_url:
        raise HTTPException(status_code=404, detail="Nenhum documento anexado a esta simulação")

    return FileResponse(
        path=simulation.document_url,
        filename=simulation.document_filename,
        media_type=guess_media_type(simulation.document_type)
    )

# ======================
# NOTIFICAÇÕES
# ======================

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna todas as notificações do usuário logado"""
    notifications = db.query(MobileNotification).filter(
        MobileNotification.user_id == current_user.id
    ).order_by(MobileNotification.created_at.desc()).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "is_read": n.is_read,
            "created_at": n.created_at
        }
        for n in notifications
    ]

@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marca uma notificação como lida"""
    notification = db.query(MobileNotification).filter(
        MobileNotification.id == notification_id,
        MobileNotification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")

    notification.is_read = True
    db.commit()

    return {"message": "Notificação marcada como lida"}

# ======================
# ENDPOINTS DE ANÁLISE DE SIMULAÇÕES
# ======================

def check_client_status(db: Session, user_id: int, cpf: str | None = None) -> dict:
    """
    Verifica se o cliente é novo ou tem contrato ativo/efetivado.
    Retorna dict com client_type e has_active_contract.
    """
    # Buscar contratos do cliente através do CPF (User.cpf -> Client.cpf -> Case -> Contract)
    from ..models import Case, Client

    raw_cpf = cpf
    if not raw_cpf:
        user = db.query(User).filter(User.id == user_id).first()
        raw_cpf = getattr(user, "cpf", None) if user else None

    cpf_digits = re.sub(r"\\D", "", raw_cpf or "")
    if len(cpf_digits) != 11:
        return {"client_type": "new_client", "has_active_contract": False}

    client_ids = [cid for (cid,) in db.query(Client.id).filter(Client.cpf == cpf_digits).all()]
    if not client_ids:
        return {"client_type": "new_client", "has_active_contract": False}

    case_ids = [cid for (cid,) in db.query(Case.id).filter(Case.client_id.in_(client_ids)).all()]
    if not case_ids:
        return {"client_type": "new_client", "has_active_contract": False}

    active_contract = db.query(Contract).filter(
        Contract.case_id.in_(case_ids),
        Contract.status.in_(["ativo", "efetivado"])
    ).first()

    has_active = active_contract is not None

    return {
        "client_type": "existing_client" if has_active else "new_client",
        "has_active_contract": has_active
    }

@router.post("/admin/simulations/{simulation_id}/pend")
async def pend_simulation(
    simulation_id: str,
    request_data: PendSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Pendencia uma simulação solicitando documentos adicionais do cliente.
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Atualizar status e informações
    sim.analysis_status = "pending_docs"
    sim.status = "pending_docs"
    sim.analyst_id = current_user.id
    sim.analyst_notes = request_data.analyst_notes
    sim.pending_documents = [doc.model_dump() for doc in request_data.pending_documents]
    sim.analyzed_at = now_brt()

    # Criar notificação para o cliente
    doc_list = "\n".join([f"- {doc.type}: {doc.description}" for doc in request_data.pending_documents])
    create_notification(
        db,
        sim.user_id,
        "Documentos Pendentes",
        f"Sua simulação precisa de documentos adicionais:\n{doc_list}\n\nObservações: {request_data.analyst_notes}",
        "warning",
        push_data={"type": "simulation", "simulationId": sim.id},
    )

    db.commit()

    return {"message": "Simulação pendenciada com sucesso", "pending_documents": sim.pending_documents}

@router.post("/admin/simulations/{simulation_id}/reprove")
async def reprove_simulation_for_analysis(
    simulation_id: str,
    request_data: ReproveSimulationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reprova uma simulação na fase de análise.
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Atualizar status
    sim.analysis_status = "reproved"
    sim.status = "rejected"
    sim.updated_at = now_brt()
    sim.analyst_id = current_user.id
    sim.analyst_notes = request_data.analyst_notes
    sim.analyzed_at = now_brt()

    # Criar notificação para o cliente
    create_notification(
        db,
        sim.user_id,
        "Simulação Reprovada",
        f"Sua simulação foi reprovada.\n\nMotivo: {request_data.analyst_notes}",
        "error",
        push_data={"type": "simulation", "simulationId": sim.id},
    )

    db.commit()

    return {"message": "Simulação reprovada com sucesso"}

@router.post("/admin/simulations/{simulation_id}/approve-for-calculation")
async def approve_simulation_for_calculation(
    simulation_id: str,
    request_data: ApproveForCalculationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aprova uma simulação e envia para a fase de Simulação com o Calculista (Multi Bancos).
    A simulação fica disponível para o calculista processar.
    """
    if current_user.role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Acesso negado")

    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Atualizar status
    sim.analysis_status = "approved_for_calculation"
    # Importante: NÃO enviar para aprovação do cliente ainda.
    # Nesta etapa, a simulação vai para o calculista montar a proposta multi-banco.
    sim.status = "approved_for_calculation"
    sim.analyst_id = current_user.id
    if request_data.analyst_notes:
        sim.analyst_notes = request_data.analyst_notes
    sim.analyzed_at = now_brt()

    # Criar notificação para o cliente
    create_notification(
        db,
        sim.user_id,
        "Análise Aprovada",
        f"Sua simulação foi aprovada e está sendo processada pelo nosso calculista!{f' Observações: {request_data.analyst_notes}' if request_data.analyst_notes else ''}",
        "success",
        push_data={"type": "simulation", "simulationId": sim.id},
    )

    db.commit()

    return {"message": "Simulação aprovada e enviada para o calculista com sucesso"}
