"""
Novos endpoints para mobile.py - registro de cliente e upload de documentos
"""

# Adicionar aos imports:
from fastapi import File, UploadFile, Form
import os
import shutil
from pathlib import Path

# Criar diretório para uploads se não existir
UPLOAD_DIR = Path("uploads/mobile_documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ======================
# SCHEMAS
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

# ======================
# PUBLIC ENDPOINTS (sem autenticação)
# ======================

@router.post("/register", response_model=ClientRegisterResponse, status_code=201)
async def register_mobile_client(
    client_data: ClientRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registra um novo cliente mobile.
    Este endpoint NÃO requer autenticação pois é usado no cadastro inicial do app.
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
        "message": "Cliente registrado com sucesso! Aguarde aprovação do sistema web."
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
    O arquivo é salvo e a simulação é criada com status 'pending'.
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
        requested_amount=0,  # Será preenchido pelo admin
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

# ======================
# ADMIN ENDPOINTS - CORRIGIR FILTRO
# ======================

@router.get("/admin/clients", response_model=List[AdminClientResponse])
async def get_admin_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lista APENAS clientes mobile (role = 'mobile_client')"""
    if current_user.role not in ["admin", "supervisor", "atendente"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # CORRIGIDO: Filtrar apenas usuários com role 'mobile_client'
    mobile_clients = db.query(User).filter(
        User.role == "mobile_client"
    ).order_by(User.created_at.desc()).all()
    
    return mobile_clients

@router.get("/admin/documents/{simulation_id}")
async def get_simulation_document(
    simulation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retorna o documento anexado a uma simulação"""
    if current_user.role not in ["admin", "supervisor", "atendente"]:
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
