from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date
from sqlalchemy.orm import Session
from ..db import get_db
from ..rbac import require_roles
from typing import List, Optional

r = APIRouter(prefix="/campanhas", tags=["campanhas"])

# Modelo Pydantic para criação de campanha
class PremiacaoInput(BaseModel):
    posicao: str
    premio: str

class CampanhaInput(BaseModel):
    nome: str
    descricao: str
    data_inicio: str  # formato: YYYY-MM-DD
    data_fim: str     # formato: YYYY-MM-DD
    status: str = "proxima"  # ativa, proxima, encerrada
    premiacoes: List[PremiacaoInput]

class CampanhaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    status: Optional[str] = None
    premiacoes: Optional[List[PremiacaoInput]] = None
    progresso: Optional[int] = None

# Por enquanto, armazenamento em memória (substituir por banco de dados)
CAMPANHAS_DB = []

@r.get("")
def listar_campanhas(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente", "calculista", "financeiro"))
):
    """Lista todas as campanhas, com filtro opcional por status"""
    campanhas = CAMPANHAS_DB

    if status:
        campanhas = [c for c in campanhas if c.get("status") == status]

    return {"items": campanhas}

@r.post("")
def criar_campanha(
    data: CampanhaInput,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Cria uma nova campanha de engajamento"""

    # Validar datas
    try:
        data_inicio = datetime.fromisoformat(data.data_inicio).date()
        data_fim = datetime.fromisoformat(data.data_fim).date()
    except:
        raise HTTPException(400, "Formato de data inválido. Use YYYY-MM-DD")

    if data_fim < data_inicio:
        raise HTTPException(400, "Data de fim não pode ser anterior à data de início")

    # Validar status
    if data.status not in ["ativa", "proxima", "encerrada"]:
        raise HTTPException(400, "Status deve ser: ativa, proxima ou encerrada")

    # Criar nova campanha
    nova_campanha = {
        "id": len(CAMPANHAS_DB) + 1,
        "nome": data.nome,
        "descricao": data.descricao,
        "periodo": f"{data_inicio.strftime('%d/%m/%Y')} - {data_fim.strftime('%d/%m/%Y')}",
        "data_inicio": data.data_inicio,
        "data_fim": data.data_fim,
        "status": data.status,
        "premiacoes": [{"posicao": p.posicao, "premio": p.premio} for p in data.premiacoes],
        "progresso": 0,
        "vencedores": None,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": user.id
    }

    CAMPANHAS_DB.append(nova_campanha)

    return nova_campanha

@r.get("/{campanha_id}")
def obter_campanha(
    campanha_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente", "calculista", "financeiro"))
):
    """Obtém detalhes de uma campanha específica"""
    campanha = next((c for c in CAMPANHAS_DB if c["id"] == campanha_id), None)

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    return campanha

@r.put("/{campanha_id}")
def atualizar_campanha(
    campanha_id: int,
    data: CampanhaUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Atualiza uma campanha existente"""
    campanha = next((c for c in CAMPANHAS_DB if c["id"] == campanha_id), None)

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    # Atualizar campos fornecidos
    if data.nome is not None:
        campanha["nome"] = data.nome
    if data.descricao is not None:
        campanha["descricao"] = data.descricao
    if data.status is not None:
        if data.status not in ["ativa", "proxima", "encerrada"]:
            raise HTTPException(400, "Status deve ser: ativa, proxima ou encerrada")
        campanha["status"] = data.status
    if data.progresso is not None:
        campanha["progresso"] = min(100, max(0, data.progresso))
    if data.premiacoes is not None:
        campanha["premiacoes"] = [{"posicao": p.posicao, "premio": p.premio} for p in data.premiacoes]

    # Atualizar datas e período se fornecidas
    if data.data_inicio or data.data_fim:
        data_inicio_str = data.data_inicio or campanha["data_inicio"]
        data_fim_str = data.data_fim or campanha["data_fim"]

        try:
            data_inicio = datetime.fromisoformat(data_inicio_str).date()
            data_fim = datetime.fromisoformat(data_fim_str).date()
        except:
            raise HTTPException(400, "Formato de data inválido. Use YYYY-MM-DD")

        if data_fim < data_inicio:
            raise HTTPException(400, "Data de fim não pode ser anterior à data de início")

        campanha["data_inicio"] = data_inicio_str
        campanha["data_fim"] = data_fim_str
        campanha["periodo"] = f"{data_inicio.strftime('%d/%m/%Y')} - {data_fim.strftime('%d/%m/%Y')}"

    campanha["updated_at"] = datetime.utcnow().isoformat()

    return campanha

@r.delete("/{campanha_id}")
def deletar_campanha(
    campanha_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Deleta uma campanha"""
    global CAMPANHAS_DB
    campanha = next((c for c in CAMPANHAS_DB if c["id"] == campanha_id), None)

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    CAMPANHAS_DB = [c for c in CAMPANHAS_DB if c["id"] != campanha_id]

    return {"message": "Campanha deletada com sucesso"}
