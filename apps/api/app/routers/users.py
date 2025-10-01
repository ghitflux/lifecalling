from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from ..rbac import require_roles
from ..security import get_current_user, hash_password
from ..db import SessionLocal
from ..models import User
from datetime import datetime

r = APIRouter(prefix="/users", tags=["users"])

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

@r.get("", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = Query(None, description="Buscar por nome ou email"),
    role: Optional[str] = Query(None, description="Filtrar por role"),
    active: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Lista todos os usuários com filtros opcionais"""
    with SessionLocal() as db:
        query = db.query(User)
        
        # Filtro de busca por nome ou email
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%")
                )
            )
        
        # Filtro por role
        if role:
            query = query.filter(User.role == role)
        
        # Filtro por status ativo
        if active is not None:
            query = query.filter(User.active == active)
        
        # Ordenação e paginação
        users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
        
        return users

@r.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Obtém detalhes de um usuário específico"""
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        return user

@r.post("", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Cria um novo usuário"""
    with SessionLocal() as db:
        # Verificar se email já existe
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email já está em uso")
        
        # Validar role
        valid_roles = ["admin", "supervisor", "financeiro", "calculista", "atendente"]
        if user_data.role not in valid_roles:
            raise HTTPException(status_code=400, detail=f"Role deve ser um dos: {', '.join(valid_roles)}")
        
        # Apenas admin pode criar outros admins
        if user_data.role == "admin" and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Apenas administradores podem criar outros administradores")
        
        # Criar usuário
        new_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            role=user_data.role,
            active=user_data.active,
            created_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user

@r.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Atualiza um usuário existente"""
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Verificar se pode editar este usuário
        if user.role == "admin" and current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Apenas administradores podem editar outros administradores")
        
        # Atualizar campos fornecidos
        if user_data.name is not None:
            user.name = user_data.name
        
        if user_data.email is not None:
            # Verificar se novo email já existe
            existing = db.query(User).filter(User.email == user_data.email, User.id != user_id).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email já está em uso")
            user.email = user_data.email
        
        if user_data.password is not None:
            user.password_hash = hash_password(user_data.password)
        
        if user_data.role is not None:
            valid_roles = ["admin", "supervisor", "financeiro", "calculista", "atendente"]
            if user_data.role not in valid_roles:
                raise HTTPException(status_code=400, detail=f"Role deve ser um dos: {', '.join(valid_roles)}")
            
            # Apenas admin pode alterar role para admin
            if user_data.role == "admin" and current_user.role != "admin":
                raise HTTPException(status_code=403, detail="Apenas administradores podem promover usuários a administrador")
            
            user.role = user_data.role
        
        if user_data.active is not None:
            user.active = user_data.active
        
        db.commit()
        db.refresh(user)
        
        return user

@r.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_roles("admin"))
):
    """Remove um usuário (apenas admin)"""
    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        # Não permitir deletar a si mesmo
        if user.id == current_user.id:
            raise HTTPException(status_code=400, detail="Não é possível deletar seu próprio usuário")
        
        # Verificar se usuário tem casos atribuídos
        from ..models import Case
        assigned_cases = db.query(Case).filter(Case.assigned_user_id == user_id).count()
        if assigned_cases > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Usuário possui {assigned_cases} casos atribuídos. Reatribua os casos antes de deletar."
            )
        
        db.delete(user)
        db.commit()
        
        return {"message": "Usuário removido com sucesso"}

@r.get("/stats/summary")
def users_stats(current_user: User = Depends(require_roles("admin", "supervisor"))):
    """Estatísticas gerais dos usuários"""
    with SessionLocal() as db:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.active == True).count()
        
        # Contagem por role
        roles_count = {}
        for role in ["admin", "supervisor", "financeiro", "calculista", "atendente"]:
            count = db.query(User).filter(User.role == role, User.active == True).count()
            roles_count[role] = count
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "roles_distribution": roles_count
        }