from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import shutil
from pathlib import Path
from ..db import SessionLocal
from ..models import User, MobileSimulation, MobileNotification, now_brt
from ..security import get_current_user, hash_password
from decimal import Decimal

router = APIRouter(prefix="/mobile", tags=["mobile"])

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
    # Alias esperados pelo frontend
    amount: Optional[float] = None  # Mesmo valor de requested_amount
    type: Optional[str] = None      # Mesmo valor de simulation_type
    # Campos de documento
    document_url: Optional[str] = None
    document_type: Optional[str] = None
    document_filename: Optional[str] = None
class DocumentResponse(BaseModel):
    id: str
    document_type: Optional[str] = None
    document_filename: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class MarginResponse(BaseModel):
    available_margin: float
    used_margin: float
    total_margin: float

# Helpers
def decimal_to_float(value):
    return float(value) if value is not None else None

def generate_fake_cpf(user_id: int) -> str:
    """Gera um CPF fictício determinístico a partir do ID do usuário (11 dígitos)."""
    return str(10000000000 + user_id)[-11:]

def generate_fake_phone(user_id: int) -> str:
    """Gera um número de WhatsApp fictício com DDI/DDD."""
    return f"+5511{str(900000000 + user_id)[-9:]}"

def serialize_admin_simulation(sim: MobileSimulation) -> dict:
    """Serializa uma MobileSimulation para o formato esperado pelo frontend admin."""
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
        "status": sim.status,
        "created_at": sim.created_at,
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
    }

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ======================
# PUBLIC ENDPOINTS (sem autenticação - para cadastro inicial no app)
# ======================

class ClientRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    cpf: Optional[str] = None
    phone: Optional[str] = None

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
    # Verificar se email já existe
    existing_user = db.query(User).filter(User.email == client_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Criar novo usuário com role 'mobile_client'
    new_user = User(
        name=client_data.name,
        email=client_data.email,
        password_hash=hash_password(client_data.password),
        cpf=(client_data.cpf or "").strip() or None,
        phone=(client_data.phone or "").strip() or None,
        role="mobile_client",  # Role específica para clientes mobile
        active=True
    )
    
    db.add(new_user)
    db.commit()
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
    
    # Gerar nome único para o arquivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{current_user.id}_{timestamp}{file_ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Salvar arquivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(document.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
    
    # Criar simulação com documento anexado
    new_simulation = MobileSimulation(
        user_id=current_user.id,
        simulation_type=simulation_type,
        requested_amount=0,  # Será preenchido pelo admin no sistema web
        installments=0,
        interest_rate=0,
        installment_value=0,
        total_amount=0,
        status="pending",
        document_url=str(file_path),
        document_type=file_ext.lstrip('.'),
        document_filename=document.filename
    )
    
    db.add(new_simulation)
    db.commit()
    db.refresh(new_simulation)
    
    return {
        "simulation_id": new_simulation.id,
        "status": "pending",
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

    sim.status = "approved_by_client"
    db.commit()
    db.refresh(sim)
    create_notification(
        db,
        current_user.id,
        "Simulação aprovada",
        "Você aprovou a simulação. Vamos iniciar o financeiro.",
        "success"
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

    sim.status = "rejected"
    db.commit()
    db.refresh(sim)
    create_notification(
        db,
        current_user.id,
        "Simulação rejeitada",
        "Você rejeitou esta simulação.",
        "warning"
    )
    return sim

@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista documentos enviados pelo cliente (simulações com anexo)."""
    sims = db.query(MobileSimulation).filter(
        MobileSimulation.user_id == current_user.id,
        MobileSimulation.document_url.isnot(None)
    ).order_by(MobileSimulation.created_at.desc()).all()

    return [
        {
            "id": sim.id,
            "document_type": sim.document_type,
            "document_filename": sim.document_filename,
            "status": sim.status,
            "created_at": sim.created_at,
        }
        for sim in sims
    ]

@router.get("/documents/{simulation_id}")
async def download_document(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download de documento do próprio cliente."""
    simulation = db.query(MobileSimulation).filter(
        MobileSimulation.id == simulation_id,
        MobileSimulation.user_id == current_user.id
    ).first()

    if not simulation:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    if not simulation.document_url:
        raise HTTPException(status_code=404, detail="Nenhum documento anexado a esta simulação")

    return FileResponse(
        path=simulation.document_url,
        filename=simulation.document_filename,
        media_type=f"{'application/pdf' if simulation.document_type == 'pdf' else 'image/' + simulation.document_type}"
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

@router.get("/admin/clients", response_model=List[AdminClientResponse])
async def get_admin_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # CORRIGIDO: Retornar APENAS clientes mobile (role = 'mobile_client')
    mobile_clients = db.query(User).filter(
        User.role == "mobile_client"
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

@router.get("/admin/simulations", response_model=List[AdminSimulationResponse])
async def get_admin_simulations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Join with User to get client details
    simulations = (
        db.query(MobileSimulation)
        .options(selectinload(MobileSimulation.user))
        .join(User)
        .order_by(MobileSimulation.created_at.desc())
        .all()
    )
    return [serialize_admin_simulation(sim) for sim in simulations]

def create_notification(db: Session, user_id: int, title: str, message: str, type: str = "info"):
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
    return notif

@router.post("/admin/simulations", response_model=AdminSimulationResponse)
def create_admin_simulation(
    simulation: MobileSimulationCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
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
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
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

@router.get("/admin/simulations/{simulation_id}", response_model=AdminSimulationResponse)
async def get_admin_simulation_by_id(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify admin access
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Join with User to get client details
    sim = (
        db.query(MobileSimulation)
        .options(selectinload(MobileSimulation.user))
        .join(User)
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
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    sim = db.query(MobileSimulation).filter(MobileSimulation.id == simulation_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")

    # Verificar se o cliente já aprovou
    client_approved_statuses = ["approved_by_client", "cliente_aprovada", "simulacao_aprovada"]

    if sim.status.lower() in client_approved_statuses:
        # Cliente já aprovou, enviar direto para o financeiro
        sim.status = "financeiro_pendente"
        create_notification(
            db,
            sim.user_id,
            "Proposta enviada ao financeiro",
            "Sua simulação foi aprovada e enviada ao setor financeiro para processamento.",
            "success"
        )
        message = "Simulação enviada ao financeiro com sucesso"
    else:
        # Primeira aprovação do admin, aguardando aprovação do cliente no app
        sim.status = "approved"
        create_notification(
            db,
            sim.user_id,
            "Nova proposta disponível",
            "Sua simulação foi aprovada e aguarda sua confirmação.",
            "info"
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
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
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
        "error"
    )

    db.commit()
    return {"message": "Simulação reprovada com sucesso"}

@router.get("/admin/documents/{simulation_id}")
async def get_simulation_document(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna o documento anexado a uma simulação"""
    if current_user.role not in ["admin", "supervisor", "atendente", "calculista"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    simulation = db.query(MobileSimulation).filter(
        MobileSimulation.id == simulation_id
    ).first()
    
    if not simulation:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    
    if not simulation.document_url:
        raise HTTPException(status_code=404, detail="Nenhum documento anexado a esta simulação")
    
    # Retornar arquivo
    from fastapi.responses import FileResponse
    return FileResponse(
        path=simulation.document_url,
        filename=simulation.document_filename,
        media_type=f"{'application/pdf' if simulation.document_type == 'pdf' else 'image/' + simulation.document_type}"
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
    notification_id: int,
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

