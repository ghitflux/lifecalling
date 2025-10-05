from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case
# (remove unused import)
from ..db import get_db
from ..rbac import require_roles
from ..models import Campaign, User, Contract, Case
from typing import List, Optional
import json
from decimal import Decimal

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
    criterio_pontuacao: str = "consultoria_liquida"  # volume_contratos, percentual_renda_liquida, consultoria_liquida, ticket_medio
    premiacoes: List[PremiacaoInput]
    meta_contratos: Optional[int] = None
    meta_consultoria: Optional[float] = None

class CampanhaUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_inicio: Optional[str] = None
    data_fim: Optional[str] = None
    status: Optional[str] = None
    criterio_pontuacao: Optional[str] = None
    premiacoes: Optional[List[PremiacaoInput]] = None
    meta_contratos: Optional[int] = None
    meta_consultoria: Optional[float] = None

@r.get("")
def listar_campanhas(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente", "calculista", "financeiro"))
):
    """Lista todas as campanhas, com filtro opcional por status"""
    query = db.query(Campaign).options(joinedload(Campaign.creator))

    if status:
        query = query.filter(Campaign.status == status)

    campanhas = query.order_by(Campaign.created_at.desc()).all()

    # Converter para formato de resposta
    items = []
    for campanha in campanhas:
        premiacoes = json.loads(campanha.premiacoes) if campanha.premiacoes else []
        items.append({
            "id": campanha.id,
            "nome": campanha.nome,
            "descricao": campanha.descricao,
            "periodo": f"{campanha.data_inicio.strftime('%d/%m/%Y')} - {campanha.data_fim.strftime('%d/%m/%Y')}",
            "data_inicio": campanha.data_inicio.isoformat(),
            "data_fim": campanha.data_fim.isoformat(),
            "status": campanha.status,
            "criterio_pontuacao": campanha.criterio_pontuacao,
            "premiacoes": premiacoes,
            "meta_contratos": campanha.meta_contratos,
            "meta_consultoria": float(campanha.meta_consultoria) if campanha.meta_consultoria else None,
            "progresso": 0,  # TODO: calcular progresso real baseado nos dados
            "vencedores": None,  # TODO: implementar cálculo de vencedores
            "created_at": campanha.created_at.isoformat(),
            "created_by": campanha.created_by,
            "creator_name": campanha.creator.name if campanha.creator else None
        })

    return {"items": items}

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
    except (ValueError, TypeError):
        raise HTTPException(400, "Formato de data inválido. Use YYYY-MM-DD")

    if data_fim < data_inicio:
        raise HTTPException(400, "Data de fim não pode ser anterior à data de início")

    # Validar status
    if data.status not in ["ativa", "proxima", "encerrada"]:
        raise HTTPException(400, "Status deve ser: ativa, proxima ou encerrada")

    # Validar critério de pontuação
    criterios_validos = ["volume_contratos", "percentual_renda_liquida", "consultoria_liquida", "ticket_medio"]
    if data.criterio_pontuacao not in criterios_validos:
        raise HTTPException(400, f"Critério de pontuação deve ser um de: {', '.join(criterios_validos)}")

    # Converter premiações para JSON
    premiacoes_json = json.dumps([{"posicao": p.posicao, "premio": p.premio} for p in data.premiacoes])

    # Criar nova campanha no banco
    nova_campanha = Campaign(
        nome=data.nome,
        descricao=data.descricao,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status=data.status,
        criterio_pontuacao=data.criterio_pontuacao,
        premiacoes=premiacoes_json,
        meta_contratos=data.meta_contratos,
        meta_consultoria=data.meta_consultoria,
        created_by=user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(nova_campanha)
    db.commit()
    db.refresh(nova_campanha)

    # Retornar no formato esperado
    premiacoes = json.loads(nova_campanha.premiacoes) if nova_campanha.premiacoes else []
    return {
        "id": nova_campanha.id,
        "nome": nova_campanha.nome,
        "descricao": nova_campanha.descricao,
        "periodo": f"{nova_campanha.data_inicio.strftime('%d/%m/%Y')} - {nova_campanha.data_fim.strftime('%d/%m/%Y')}",
        "data_inicio": nova_campanha.data_inicio.isoformat(),
        "data_fim": nova_campanha.data_fim.isoformat(),
        "status": nova_campanha.status,
        "criterio_pontuacao": nova_campanha.criterio_pontuacao,
        "premiacoes": premiacoes,
        "meta_contratos": nova_campanha.meta_contratos,
        "meta_consultoria": float(nova_campanha.meta_consultoria) if nova_campanha.meta_consultoria else None,
        "progresso": 0,
        "vencedores": None,
        "created_at": nova_campanha.created_at.isoformat(),
        "created_by": nova_campanha.created_by
    }

@r.get("/{campanha_id}")
def obter_campanha(
    campanha_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente", "calculista", "financeiro"))
):
    """Obtém detalhes de uma campanha específica"""
    campanha = db.query(Campaign).options(joinedload(Campaign.creator)).filter(Campaign.id == campanha_id).first()

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    # Converter para formato de resposta
    premiacoes = json.loads(campanha.premiacoes) if campanha.premiacoes else []
    return {
        "id": campanha.id,
        "nome": campanha.nome,
        "descricao": campanha.descricao,
        "periodo": f"{campanha.data_inicio.strftime('%d/%m/%Y')} - {campanha.data_fim.strftime('%d/%m/%Y')}",
        "data_inicio": campanha.data_inicio.isoformat(),
        "data_fim": campanha.data_fim.isoformat(),
        "status": campanha.status,
        "criterio_pontuacao": campanha.criterio_pontuacao,
        "premiacoes": premiacoes,
        "meta_contratos": campanha.meta_contratos,
        "meta_consultoria": float(campanha.meta_consultoria) if campanha.meta_consultoria else None,
        "progresso": 0,  # TODO: calcular progresso real baseado nos dados
        "vencedores": None,  # TODO: implementar cálculo de vencedores
        "created_at": campanha.created_at.isoformat(),
        "created_by": campanha.created_by,
        "creator_name": campanha.creator.name if campanha.creator else None
    }

@r.put("/{campanha_id}")
def atualizar_campanha(
    campanha_id: int,
    data: CampanhaUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Atualiza uma campanha existente"""
    campanha = db.query(Campaign).filter(Campaign.id == campanha_id).first()

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    # Atualizar campos fornecidos
    if data.nome is not None:
        campanha.nome = data.nome
    if data.descricao is not None:
        campanha.descricao = data.descricao
    if data.status is not None:
        if data.status not in ["ativa", "proxima", "encerrada"]:
            raise HTTPException(400, "Status deve ser: ativa, proxima ou encerrada")
        campanha.status = data.status
    if data.criterio_pontuacao is not None:
        criterios_validos = ["volume_contratos", "percentual_renda_liquida", "consultoria_liquida", "ticket_medio"]
        if data.criterio_pontuacao not in criterios_validos:
            raise HTTPException(400, f"Critério de pontuação deve ser um de: {', '.join(criterios_validos)}")
        campanha.criterio_pontuacao = data.criterio_pontuacao
    if data.meta_contratos is not None:
        campanha.meta_contratos = data.meta_contratos
    if data.meta_consultoria is not None:
        campanha.meta_consultoria = data.meta_consultoria
    if data.premiacoes is not None:
        premiacoes_json = json.dumps([{"posicao": p.posicao, "premio": p.premio} for p in data.premiacoes])
        campanha.premiacoes = premiacoes_json

    # Atualizar datas se fornecidas
    if data.data_inicio or data.data_fim:
        data_inicio_str = data.data_inicio or campanha.data_inicio.isoformat()
        data_fim_str = data.data_fim or campanha.data_fim.isoformat()

        try:
            data_inicio = datetime.fromisoformat(data_inicio_str).date()
            data_fim = datetime.fromisoformat(data_fim_str).date()
        except (ValueError, TypeError):
            raise HTTPException(400, "Formato de data inválido. Use YYYY-MM-DD")

        if data_fim < data_inicio:
            raise HTTPException(400, "Data de fim não pode ser anterior à data de início")

        campanha.data_inicio = data_inicio
        campanha.data_fim = data_fim

    campanha.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(campanha)

    # Retornar no formato esperado
    premiacoes = json.loads(campanha.premiacoes) if campanha.premiacoes else []
    return {
        "id": campanha.id,
        "nome": campanha.nome,
        "descricao": campanha.descricao,
        "periodo": f"{campanha.data_inicio.strftime('%d/%m/%Y')} - {campanha.data_fim.strftime('%d/%m/%Y')}",
        "data_inicio": campanha.data_inicio.isoformat(),
        "data_fim": campanha.data_fim.isoformat(),
        "status": campanha.status,
        "criterio_pontuacao": campanha.criterio_pontuacao,
        "premiacoes": premiacoes,
        "meta_contratos": campanha.meta_contratos,
        "meta_consultoria": float(campanha.meta_consultoria) if campanha.meta_consultoria else None,
        "progresso": 0,  # TODO: calcular progresso real baseado nos dados
        "vencedores": None,  # TODO: implementar cálculo de vencedores
        "created_at": campanha.created_at.isoformat(),
        "created_by": campanha.created_by
    }

@r.delete("/{campanha_id}")
def deletar_campanha(
    campanha_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Deleta uma campanha"""
    campanha = db.query(Campaign).filter(Campaign.id == campanha_id).first()

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    db.delete(campanha)
    db.commit()

    return {"message": "Campanha deletada com sucesso"}


@r.get("/{campanha_id}/ranking")
def obter_ranking_campanha(
    campanha_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "user"))
):
    """Obtém o ranking de uma campanha específica"""
    campanha = db.query(Campaign).filter(Campaign.id == campanha_id).first()

    if not campanha:
        raise HTTPException(404, "Campanha não encontrada")

    # Verificar se a campanha está ativa
    hoje = date.today()
    if hoje < campanha.data_inicio or hoje > campanha.data_fim:
        return {
            "campanha": {
                "id": campanha.id,
                "nome": campanha.nome,
                "status": "inativa"
            },
            "ranking": [],
            "total_participantes": 0
        }

    # Calcular métricas para cada usuário no período da campanha
    usuarios_query = db.query(User).filter(User.active)

    ranking = []

    for usuario in usuarios_query:
        # Buscar contratos no período da campanha usando agent_user_id e signed_at
        contratos = db.query(Contract).filter(
            Contract.agent_user_id == usuario.id,
            Contract.signed_at >= campanha.data_inicio,
            Contract.signed_at <= campanha.data_fim,
            Contract.status == "ativo"
        ).all()

        # Buscar casos no período da campanha
        casos = db.query(Case).filter(
            Case.assigned_user_id == usuario.id,
            Case.created_at >= campanha.data_inicio,
            Case.created_at <= campanha.data_fim
        ).all()

        # Calcular métricas
        volume_contratos = len(contratos)
        valor_total_contratos = sum(float(c.total_amount or 0) for c in contratos)
        valor_consultoria = sum(float(c.consultoria_valor_liquido or 0) for c in contratos)

        # Calcular renda líquida (assumindo que é o valor dos contratos menos custos)
        renda_liquida = valor_total_contratos * 0.8  # Exemplo: 80% do valor é líquido
        percentual_renda_liquida = (renda_liquida / valor_total_contratos * 100) if valor_total_contratos > 0 else 0

        # Calcular ticket médio
        ticket_medio = valor_total_contratos / volume_contratos if volume_contratos > 0 else 0

        # Calcular pontuação baseada no critério da campanha
        pontuacao = 0

        if campanha.criterio_pontuacao == "volume_contratos":
            pontuacao = volume_contratos
        elif campanha.criterio_pontuacao == "percentual_renda_liquida":
            pontuacao = percentual_renda_liquida
        elif campanha.criterio_pontuacao == "valor_consultoria_liquida":
            pontuacao = valor_consultoria
        elif campanha.criterio_pontuacao == "ticket_medio":
            pontuacao = ticket_medio

        # Verificar se atende às metas mínimas
        atende_meta_contratos = volume_contratos >= (campanha.meta_contratos or 0)
        atende_meta_consultoria = valor_consultoria >= float(campanha.meta_consultoria or 0)

        if atende_meta_contratos and atende_meta_consultoria:
            ranking.append({
                "usuario": {
                    "id": usuario.id,
                    "nome": usuario.name,
                    "email": usuario.email
                },
                "metricas": {
                    "volume_contratos": volume_contratos,
                    "valor_total_contratos": valor_total_contratos,
                    "renda_liquida": renda_liquida,
                    "percentual_renda_liquida": round(percentual_renda_liquida, 2),
                    "valor_consultoria": valor_consultoria,
                    "ticket_medio": round(ticket_medio, 2)
                },
                "pontuacao": round(pontuacao, 2),
                "atende_metas": {
                    "contratos": atende_meta_contratos,
                    "consultoria": atende_meta_consultoria
                }
            })

    # Ordenar por pontuação (maior para menor)
    ranking.sort(key=lambda x: x["pontuacao"], reverse=True)

    # Adicionar posição no ranking
    for i, participante in enumerate(ranking):
        participante["posicao"] = i + 1

    return {
        "campanha": {
            "id": campanha.id,
            "nome": campanha.nome,
            "criterio_pontuacao": campanha.criterio_pontuacao,
            "periodo": f"{campanha.data_inicio.strftime('%d/%m/%Y')} - {campanha.data_fim.strftime('%d/%m/%Y')}",
            "status": "ativa"
        },
        "ranking": ranking,
         "total_participantes": len(ranking)
     }


@r.get("/ativas/rankings")
def obter_campanhas_ativas_com_rankings(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "user"))
):
    """Obtém todas as campanhas ativas com rankings resumidos"""
    hoje = date.today()

    campanhas_ativas = db.query(Campaign).filter(
        Campaign.data_inicio <= hoje,
        Campaign.data_fim >= hoje
    ).all()

    resultado = []

    for campanha in campanhas_ativas:
        # Calcular ranking resumido (top 5)
        usuarios_query = db.query(User).filter(User.active)

        ranking_resumido = []

        for usuario in usuarios_query:
            # Buscar contratos no período da campanha usando campos corretos
            contratos = db.query(Contract).join(Case, Case.id == Contract.case_id, isouter=True).filter(
                case(
                    [(Contract.agent_user_id.isnot(None), Contract.agent_user_id)],
                    else_=Case.assigned_user_id
                ) == usuario.id,
                Contract.signed_at >= campanha.data_inicio,
                Contract.signed_at <= campanha.data_fim,
                Contract.status == "ativo"
            ).all()

            # Buscar casos no período da campanha usando campos corretos
            casos = db.query(Case).filter(
                Case.assigned_user_id == usuario.id,
                Case.created_at >= campanha.data_inicio,
                Case.created_at <= campanha.data_fim
            ).all()

            # Calcular métricas usando campos corretos
            volume_contratos = len(contratos)
            valor_total_contratos = sum(float(c.total_amount or 0) for c in contratos)
            valor_consultoria = sum(float(c.consultoria_valor_liquido or 0) for c in contratos)

            # Calcular renda líquida
            renda_liquida = valor_total_contratos * 0.8
            percentual_renda_liquida = (renda_liquida / valor_total_contratos * 100) if valor_total_contratos > 0 else 0

            # Calcular ticket médio
            ticket_medio = valor_total_contratos / volume_contratos if volume_contratos > 0 else 0

            # Calcular pontuação baseada no critério da campanha
            pontuacao = 0

            if campanha.criterio_pontuacao == "volume_contratos":
                pontuacao = volume_contratos
            elif campanha.criterio_pontuacao == "percentual_renda_liquida":
                pontuacao = percentual_renda_liquida
            elif campanha.criterio_pontuacao == "consultoria_liquida":
                pontuacao = valor_consultoria
            elif campanha.criterio_pontuacao == "ticket_medio":
                pontuacao = ticket_medio

            # Verificar se atende às metas mínimas
            atende_meta_contratos = volume_contratos >= (campanha.meta_contratos or 0)
            atende_meta_consultoria = valor_consultoria >= float(campanha.meta_consultoria or 0)

            if atende_meta_contratos and atende_meta_consultoria:
                ranking_resumido.append({
                    "usuario": {
                        "id": usuario.id,
                        "nome": usuario.name
                    },
                    "pontuacao": round(pontuacao, 2)
                })

        # Ordenar por pontuação e pegar top 5
        ranking_resumido.sort(key=lambda x: x["pontuacao"], reverse=True)
        top_5 = ranking_resumido[:5]

        # Adicionar posição
        for i, participante in enumerate(top_5):
            participante["posicao"] = i + 1

        resultado.append({
            "id": campanha.id,
            "nome": campanha.nome,
            "criterio_pontuacao": campanha.criterio_pontuacao,
            "periodo": f"{campanha.data_inicio.strftime('%d/%m/%Y')} - {campanha.data_fim.strftime('%d/%m/%Y')}",
            "dias_restantes": (campanha.data_fim - hoje).days,
            "top_5_ranking": top_5,
            "total_participantes": len(ranking_resumido),
            "premiacoes": json.loads(campanha.premiacoes) if campanha.premiacoes else []
        })

    return {
        "campanhas_ativas": resultado,
        "total_campanhas": len(resultado)
    }
