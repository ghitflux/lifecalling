from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from ..db import SessionLocal
from ..rbac import require_roles
from ..models import Client, Case, PayrollClient, PayrollContract, PayrollLine
from pydantic import BaseModel

r = APIRouter(prefix="/clients", tags=["clients"])

class PageOut(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@r.get("", response_model=PageOut)
def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: str | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))
):
    """
    Lista clientes do sistema principal com casos e contratos associados.
    Unifica dados de ambos os sistemas (Client e PayrollClient).

    Args:
        page: Número da página (começa em 1)
        page_size: Itens por página (padrão 20, máximo 200)
        q: Busca por nome, CPF ou matrícula
    """
    # Query base dos clientes com contagem de casos
    clients_query = db.query(
        Client.id,
        Client.name.label("nome"),
        Client.cpf,
        Client.matricula,
        Client.orgao,
        func.count(Case.id).label("casos_count")
    ).outerjoin(
        Case, Case.client_id == Client.id
    )

    # Aplicar filtro de busca se fornecido
    if q:
        like = f"%{q}%"
        clients_query = clients_query.filter(
            or_(
                Client.name.ilike(like),
                Client.cpf.ilike(like),
                Client.matricula.ilike(like)
            )
        )

    # Agrupar antes de contar
    clients_query = clients_query.group_by(
        Client.id, Client.name, Client.cpf, Client.matricula, Client.orgao
    )

    # Contar total ANTES da paginação
    total = clients_query.count()

    # Aplicar ordenação e paginação
    clients_query = clients_query.order_by(Client.id.desc()).offset((page-1)*page_size).limit(page_size)

    results = []
    for client_data in clients_query.all():
        # Buscar contratos do PayrollClient correspondente se existir
        payroll_client = db.query(PayrollClient).filter(
            PayrollClient.cpf == client_data.cpf,
            PayrollClient.matricula == client_data.matricula
        ).first()

        contratos_count = 0
        if payroll_client:
            contratos_count = db.query(PayrollContract).filter_by(client_id=payroll_client.id).count()

        results.append({
            "id": client_data.id,
            "cpf": client_data.cpf,
            "matricula": client_data.matricula,
            "nome": client_data.nome,
            "orgao": client_data.orgao,
            "contratos": contratos_count,
            "casos": client_data.casos_count,
            "created_at": None  # Campo não disponível no modelo Client
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@r.get("/{client_id}")
def get_client(client_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))):
    """
    Retorna detalhes de um cliente específico com todos os seus contratos e casos.
    """
    # Buscar no sistema principal
    c = db.query(Client).get(client_id)
    if not c:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar casos do cliente
    cases = db.query(Case).filter_by(client_id=c.id).order_by(Case.id.desc()).all()

    # Buscar cliente correspondente no sistema payroll
    payroll_client = db.query(PayrollClient).filter(
        PayrollClient.cpf == c.cpf,
        PayrollClient.matricula == c.matricula
    ).first()

    contracts = []
    if payroll_client:
        # Buscar contratos do cliente
        payroll_contracts = db.query(PayrollContract).filter_by(client_id=payroll_client.id).order_by(
            PayrollContract.referencia_year.desc(),
            PayrollContract.referencia_month.desc()
        ).all()

        contracts = [
            {
                "id": ct.id,
                "entidade_code": ct.entidade_code,
                "entidade_name": ct.entidade_name,
                "ref": f"{ct.referencia_month:02d}/{ct.referencia_year}",
                "valor_parcela": str(ct.valor_parcela),
                "total_parcelas": ct.total_parcelas,
                "parcelas_pagas": ct.parcelas_pagas,
                "status": ct.status,
                "cargo": ct.cargo,
                "fin": ct.fin,
                "orgao_codigo": ct.orgao_codigo,
                "lanc": ct.lanc,
                "created_at": ct.created_at.isoformat() if ct.created_at else None,
            } for ct in payroll_contracts
        ]

    return {
        "id": c.id,
        "cpf": c.cpf,
        "matricula": c.matricula,
        "nome": c.name,
        "orgao": c.orgao,
        "created_at": None,  # Placeholder
        "contracts": contracts,
        "cases": [
            {
                "id": case.id,
                "status": case.status,
                "entidade": case.entidade,
                "referencia_competencia": case.referencia_competencia,
                "last_update_at": case.last_update_at.isoformat() if case.last_update_at else None,
                "assigned_to": case.assigned_user.name if case.assigned_user else None,
            } for case in cases
        ]
    }


@r.get("/{client_id}/contracts")
def get_client_contracts(client_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))):
    """
    Retorna apenas os contratos de um cliente específico.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar cliente correspondente no sistema payroll
    payroll_client = db.query(PayrollClient).filter(
        PayrollClient.cpf == client.cpf,
        PayrollClient.matricula == client.matricula
    ).first()

    if not payroll_client:
        return []

    contracts = db.query(PayrollContract).filter_by(client_id=payroll_client.id).order_by(
        PayrollContract.referencia_year.desc(),
        PayrollContract.referencia_month.desc()
    ).all()

    return [
        {
            "id": ct.id,
            "entidade_code": ct.entidade_code,
            "entidade_name": ct.entidade_name,
            "ref": f"{ct.referencia_month:02d}/{ct.referencia_year}",
            "valor_parcela": str(ct.valor_parcela),
            "total_parcelas": ct.total_parcelas,
            "parcelas_pagas": ct.parcelas_pagas,
            "status": ct.status,
            "cargo": ct.cargo,
            "fin": ct.fin,
            "orgao_codigo": ct.orgao_codigo,
            "lanc": ct.lanc,
            "created_at": ct.created_at.isoformat() if ct.created_at else None,
        } for ct in contracts
    ]


@r.get("/{client_id}/cases")
def get_client_cases(client_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))):
    """
    Retorna apenas os casos de um cliente específico.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar casos do cliente
    cases = db.query(Case).filter_by(client_id=client.id).order_by(Case.id.desc()).all()

    return {
        "items": [
            {
                "id": case.id,
                "status": case.status,
                "entidade": case.entidade,
                "referencia_competencia": case.referencia_competencia,
                "created_at": case.created_at.isoformat() if case.created_at else None,
                "last_update_at": case.last_update_at.isoformat() if case.last_update_at else None,
                "assigned_to": case.assigned_user.name if case.assigned_user else None,
            } for case in cases
        ],
        "total": len(cases)
    }

@r.get("/{client_id}/financiamentos")
def get_client_financiamentos(client_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista", "atendente"))):
    """
    Retorna financiamentos (linhas de folha) de um cliente específico.
    Mostra dados da referência mais recente por entidade.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar linhas de financiamento por CPF e Matrícula
    financiamentos = db.query(PayrollLine).filter(
        PayrollLine.cpf == client.cpf,
        PayrollLine.matricula == client.matricula
    ).order_by(
        PayrollLine.ref_year.desc(),
        PayrollLine.ref_month.desc(),
        PayrollLine.entity_code.asc()
    ).all()

    return [
        {
            "id": line.id,
            "financiamento_code": line.financiamento_code,
            "total_parcelas": line.total_parcelas,
            "parcelas_pagas": line.parcelas_pagas,
            "valor_parcela_ref": str(line.valor_parcela_ref) if line.valor_parcela_ref else "0.00",
            "orgao_pagamento": line.orgao_pagamento,
            "orgao_pagamento_nome": line.orgao_pagamento_nome,  # Nome completo do órgão
            "ref_month": line.ref_month,
            "ref_year": line.ref_year,
            "referencia": f"{line.ref_month:02d}/{line.ref_year}",
            "entity_code": line.entity_code,
            "entity_name": line.entity_name,
            "status_code": line.status_code,
            "status_description": line.status_description,
            "cargo": line.cargo,
            "orgao": line.orgao,
            "lanc": line.lanc,
            "created_at": line.created_at.isoformat() if line.created_at else None
        } for line in financiamentos
    ]

@r.delete("/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db), user=Depends(require_roles("admin"))):
    """
    Deleta um cliente (apenas admin).
    Verifica se o cliente tem casos antes de deletar.
    """
    # Buscar cliente
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Verificar se tem casos associados
    cases_count = db.query(Case).filter_by(client_id=client.id).count()
    if cases_count > 0:
        raise HTTPException(
            400,
            f"Não é possível excluir o cliente. Existem {cases_count} casos associados."
        )

    # Deletar cliente
    db.delete(client)
    db.commit()

    return {"ok": True, "message": "Cliente excluído com sucesso"}