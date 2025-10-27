from fastapi import APIRouter, Depends, HTTPException, Query  # pyright: ignore
from sqlalchemy import or_  # pyright: ignore
from pydantic import BaseModel, EmailStr  # pyright: ignore
from typing import Optional, List
from datetime import datetime

from ..rbac import require_roles
from ..security import hash_password
from ..db import SessionLocal
from ..models import User

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
    search: Optional[str] = Query(
        None, description="Buscar por nome ou email"
    ),
    role: Optional[str] = Query(None, description="Filtrar por role"),
    active: Optional[bool] = Query(
        None, description="Filtrar por status ativo"
    ),
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
        users = query.order_by(
            User.created_at.desc()
        ).offset(skip).limit(limit).all()

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
            raise HTTPException(
                status_code=404, detail="Usuário não encontrado"
            )

        return user


@r.post("", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Cria um novo usuário"""
    with SessionLocal() as db:
        # Verificar se email já existe
        existing_user = db.query(User).filter(
            User.email == user_data.email
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Email já está em uso"
            )

        # Validar role
        valid_roles = [
            "admin", "supervisor", "financeiro", "calculista", "atendente"
        ]
        if user_data.role not in valid_roles:
            raise HTTPException(
                status_code=400,
                detail=f"Role deve ser um dos: {', '.join(valid_roles)}"
            )

        # Apenas admin pode criar outros admins
        if user_data.role == "admin" and current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Apenas administradores podem criar outros "
                       "administradores"
            )

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
            raise HTTPException(
                status_code=404, detail="Usuário não encontrado"
            )

        # Verificar se email já existe (se estiver sendo alterado)
        if user_data.email and user_data.email != user.email:
            existing_user = db.query(User).filter(
                User.email == user_data.email
            ).first()
            if existing_user:
                raise HTTPException(
                    status_code=400, detail="Email já está em uso"
                )

        # Validar role (se estiver sendo alterado)
        if user_data.role:
            valid_roles = [
                "admin", "supervisor", "financeiro", "calculista", "atendente"
            ]
            if user_data.role not in valid_roles:
                raise HTTPException(
                    status_code=400,
                    detail=f"Role deve ser um dos: {', '.join(valid_roles)}"
                )

            # Apenas admin pode alterar role para admin
            if (user_data.role == "admin" and
                    current_user.role != "admin"):
                raise HTTPException(
                    status_code=403,
                    detail="Apenas administradores podem alterar role para "
                           "admin"
                )

        # Atualizar campos
        if user_data.name is not None:
            user.name = user_data.name
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.password is not None:
            user.password_hash = hash_password(user_data.password)
        if user_data.role is not None:
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
            raise HTTPException(
                status_code=404, detail="Usuário não encontrado"
            )

        # Não permitir auto-exclusão
        if user.id == current_user.id:
            raise HTTPException(
                status_code=400, detail="Não é possível remover a si mesmo"
            )

        db.delete(user)
        db.commit()

        return {"message": "Usuário removido com sucesso"}


@r.get("/stats/summary")
def users_stats(
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Estatísticas gerais dos usuários"""
    with SessionLocal() as db:
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.active).count()

        # Contagem por role
        roles_count = {}
        for role in [
            "admin", "supervisor", "financeiro", "calculista", "atendente"
        ]:
            count = db.query(User).filter(
                User.role == role, User.active
            ).count()
            roles_count[role] = count

        return {
            "total_users": total_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "roles_distribution": roles_count
        }


@r.get("/performance")
def users_performance(
    current_user: User = Depends(require_roles("admin", "supervisor"))
):
    """Dados de performance dos usuários (contratos efetivados e produção)"""
    with SessionLocal() as db:
        from ..models import Case, Contract
        from sqlalchemy import func  # pyright: ignore[reportMissingImports]
        from datetime import datetime, timedelta

        # Buscar dados dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Buscar todos os usuários ativos
        users = db.query(User).filter(User.active).all()
        performance_data = []

        for user in users:
            # Contratos efetivados pelo usuário
            contratos_efetivados = db.query(func.count(Case.id)).filter(
                Case.assigned_user_id == user.id,
                Case.status == "contrato_efetivado",
                Case.last_update_at >= thirty_days_ago
            ).scalar() or 0

            # Produção total (consultoria líquida) do usuário
            # NOVO: Calcula receitas - despesas (Impostos + Comissão)
            from ..models import FinanceIncome, FinanceExpense
            from sqlalchemy import func

            # Receitas do usuário
            receitas = db.query(
                func.coalesce(func.sum(FinanceIncome.amount), 0)
            ).filter(
                FinanceIncome.agent_user_id == user.id,
                FinanceIncome.date >= thirty_days_ago
            ).scalar() or 0

            # Despesas do usuário (Impostos + Comissão)
            despesas = db.query(
                func.coalesce(func.sum(FinanceExpense.amount), 0)
            ).filter(
                FinanceExpense.agent_user_id == user.id,
                FinanceExpense.expense_type.in_(["Impostos", "Comissão"]),
                FinanceExpense.date >= thirty_days_ago
            ).scalar() or 0

            # Produção líquida = receitas - despesas
            producao_total = float(receitas) - float(despesas)

            performance_data.append({
                "user_id": user.id,
                "contratos_efetivados": int(contratos_efetivados),
                "producao_total": float(producao_total)
            })

        return {"performance": performance_data}


class BulkDeleteRequest(BaseModel):
    ids: List[int]


@r.post("/bulk-delete")
def bulk_delete_users(
    payload: BulkDeleteRequest,
    current_user: User = Depends(require_roles("admin"))
):
    """Remove múltiplos usuários (apenas admin)"""
    with SessionLocal() as db:
        # Verificar se todos os usuários existem
        users = db.query(User).filter(User.id.in_(payload.ids)).all()
        if len(users) != len(payload.ids):
            raise HTTPException(
                status_code=404, detail="Alguns usuários não foram encontrados"
            )

        # Não permitir auto-exclusão
        if current_user.id in payload.ids:
            raise HTTPException(
                status_code=400, detail="Não é possível remover a si mesmo"
            )

        # Remover usuários
        db.query(User).filter(User.id.in_(payload.ids)).delete(
            synchronize_session=False
        )
        db.commit()

        return {
            "message": f"{len(payload.ids)} usuários removidos com sucesso"
        }
