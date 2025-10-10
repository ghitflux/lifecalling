from fastapi import APIRouter, Depends, HTTPException, Query  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import func, or_, distinct  # pyright: ignore[reportMissingImports]
from typing import List
from ..db import SessionLocal
from ..rbac import require_roles
from ..models import (
    Client, Case, PayrollClient, PayrollContract, PayrollLine, ClientPhone
)
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from datetime import datetime

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
    banco: str | None = None,
    status: str | None = None,
    orgao: str | None = None,
    sem_contratos: bool | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Lista clientes do sistema principal com casos e contratos associados.
    Unifica dados de ambos os sistemas (Client e PayrollClient).

    Args:
        page: Número da página (começa em 1)
        page_size: Itens por página (padrão 20, máximo 200)
        q: Busca por nome, CPF ou matrícula
        banco: Filtrar por banco/órgão credor (entidade do caso)
        status: Filtrar por status do caso
        orgao: Filtrar por órgão pagador (orgao do cliente)
        sem_contratos: Se True, filtra apenas clientes sem financiamentos
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

    # Filtrar por banco (entidade do caso)
    if banco:
        clients_query = clients_query.filter(Case.entidade == banco)

    # Filtrar por status do caso
    if status:
        clients_query = clients_query.filter(Case.status == status)

    # Filtrar por órgão pagador (orgao do cliente)
    if orgao:
        clients_query = clients_query.filter(Client.orgao == orgao)

    # Filtrar por clientes sem contratos
    if sem_contratos:
        # Clientes que NÃO têm financiamentos
        clients_query = clients_query.filter(
            ~db.query(PayrollLine.id).filter(
                PayrollLine.cpf == Client.cpf,
                PayrollLine.matricula == Client.matricula
            ).exists()
        )

    # Agrupar antes de contar
    clients_query = clients_query.group_by(
        Client.id, Client.name, Client.cpf, Client.matricula, Client.orgao
    )

    # Contar total ANTES da paginação
    total = clients_query.count()

    # Aplicar ordenação e paginação
    clients_query = clients_query.order_by(Client.id.desc()).offset(
        (page-1)*page_size
    ).limit(page_size)

    results = []
    for client_data in clients_query.all():
        # Contar financiamentos diretamente de PayrollLine pelo CPF
        contratos_count = db.query(func.count(PayrollLine.id)).filter(
            PayrollLine.cpf == client_data.cpf
        ).scalar() or 0

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


@r.get("/filters")
def get_available_filters(
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna filtros disponíveis para clientes (bancos credores).
    Bancos = Entidades dos casos (BANCO DO BRASIL, CAIXA, etc)
    Órgãos = Órgãos pagadores dos clientes
    """
    # Listar entidades únicas dos casos (bancos credores)
    entidades = db.query(Case.entidade).filter(
        Case.entidade.isnot(None)
    ).distinct().all()
    entidades_list = sorted([e[0] for e in entidades if e[0]])

    # Listar status de casos únicos
    status_list = db.query(Case.status).distinct().all()
    status_list = sorted([s[0] for s in status_list if s[0]])

    # Contadores por filtro
    bancos_with_count = []
    for entidade in entidades_list:
        # Contar clientes únicos que têm casos dessa entidade
        count = (
            db.query(func.count(distinct(Case.client_id)))
            .filter(Case.entidade == entidade)
            .scalar()
        )
        bancos_with_count.append({
            "value": entidade, "label": entidade, "count": count
        })

    status_with_count = []
    for status in status_list:
        count = db.query(func.count(distinct(Case.client_id))).filter(
            Case.status == status
        ).scalar()

        # Labels amigáveis
        status_labels = {
            "novo": "Novo",
            "disponivel": "Disponível",
            "em_atendimento": "Em Atendimento",
            "calculista": "Calculista",
            "calculista_pendente": "Calculista Pendente",
            "financeiro": "Financeiro",
            "fechamento_pendente": "Fechamento Pendente",
            "aprovado": "Aprovado",
            "cancelado": "Cancelado",
        }

        status_with_count.append({
            "value": status,
            "label": status_labels.get(status, status.title()),
            "count": count
        })

    # Listar órgãos únicos dos clientes (órgãos pagadores)
    orgaos = db.query(Client.orgao).filter(
        Client.orgao.isnot(None)
    ).distinct().all()
    orgaos_list = sorted([o[0] for o in orgaos if o[0]])

    orgaos_with_count = []
    for orgao in orgaos_list:
        # Contar clientes únicos com esse órgão
        count = db.query(func.count(Client.id)).filter(
            Client.orgao == orgao
        ).scalar()
        orgaos_with_count.append({
            "value": orgao, "label": orgao, "count": count
        })

    # Contar clientes sem contratos (sem financiamentos)
    clientes_sem_contratos = (
        db.query(func.count(Client.id))
        .filter(
            ~db.query(PayrollLine.id)
            .filter(
                PayrollLine.cpf == Client.cpf,
                PayrollLine.matricula == Client.matricula
            )
            .exists()
        )
        .scalar() or 0
    )

    return {
        "bancos": bancos_with_count,
        "status": status_with_count,
        "orgaos": orgaos_with_count,
        "clientes_sem_contratos": clientes_sem_contratos
    }


@r.get("/stats")
def get_clients_stats(
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna estatísticas gerais dos clientes (KPIs).
    """
    from datetime import datetime, timedelta

    # Total de clientes
    total_clients = db.query(func.count(Client.id)).scalar() or 0

    # Clientes novos (últimos 30 dias)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_clients = (
        db.query(func.count(distinct(Case.client_id)))
        .filter(Case.created_at >= thirty_days_ago)
        .scalar() or 0
    )

    # Total de casos
    total_cases = db.query(func.count(Case.id)).scalar() or 0

    # Casos ativos (status abertos)
    active_statuses = [
        "novo", "disponivel", "em_atendimento", "calculista",
        "calculista_pendente", "financeiro", "fechamento_pendente"
    ]
    active_cases = (
        db.query(func.count(Case.id))
        .filter(Case.status.in_(active_statuses))
        .scalar() or 0
    )

    # Casos finalizados (aprovado, efetivado)
    completed_statuses = [
        "aprovado", "efetivado", "calculo_aprovado", "fechamento_aprovado"
    ]
    completed_cases = (
        db.query(func.count(Case.id))
        .filter(Case.status.in_(completed_statuses))
        .scalar() or 0
    )

    # Total de contratos (financiamentos)
    from app.models import PayrollLine
    total_contracts = db.query(func.count(PayrollLine.id)).scalar() or 0

    # Clientes únicos com contratos
    clients_with_contracts = (
        db.query(func.count(Client.id))
        .filter(
            db.query(PayrollLine.id)
            .filter(
                PayrollLine.cpf == Client.cpf,
                PayrollLine.matricula == Client.matricula
            )
            .exists()
        )
        .scalar() or 0
    )

    # Taxa de conversão (casos finalizados / total de casos)
    conversion_rate = round(
        (completed_cases / total_cases * 100), 1
    ) if total_cases > 0 else 0

    return {
        "total_clients": total_clients,
        "new_clients": new_clients,
        "total_cases": total_cases,
        "active_cases": active_cases,
        "completed_cases": completed_cases,
        "total_contracts": total_contracts,
        "clients_with_contracts": clients_with_contracts,
        "conversion_rate": conversion_rate
    }


@r.get("/{client_id}")
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna detalhes de um cliente específico com contratos e casos.
    """
    # Buscar no sistema principal
    c = db.query(Client).get(client_id)
    if not c:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar casos do cliente
    cases = db.query(Case).filter_by(
        client_id=c.id
    ).order_by(Case.id.desc()).all()

    # Buscar todas as matrículas do CPF no sistema payroll
    payroll_clients = db.query(PayrollClient).filter(
        PayrollClient.cpf == c.cpf
    ).all()

    contracts = []
    for pc in payroll_clients:
        # Buscar contratos de cada matrícula
        payroll_contracts = db.query(PayrollContract).filter_by(
            client_id=pc.id
        ).order_by(
            PayrollContract.referencia_year.desc(),
            PayrollContract.referencia_month.desc()
        ).all()

        for ct in payroll_contracts:
            contracts.append({
                "id": ct.id,
                "matricula": pc.matricula,
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
                "created_at": (
                    ct.created_at.isoformat() if ct.created_at else None
                ),
            })

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
                "last_update_at": (
                    case.last_update_at.isoformat()
                    if case.last_update_at else None
                ),
                "assigned_to": (
                    case.assigned_user.name
                    if case.assigned_user else None
                ),
            } for case in cases
        ]
    }


@r.get("/{client_id}/contracts")
def get_client_contracts(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna todos os contratos de todas as matrículas do CPF.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar todas as matrículas do CPF no sistema payroll
    payroll_clients = db.query(PayrollClient).filter(
        PayrollClient.cpf == client.cpf
    ).all()

    if not payroll_clients:
        return []

    # Buscar contratos de todas as matrículas
    all_contracts = []
    for pc in payroll_clients:
        contracts = db.query(PayrollContract).filter_by(
            client_id=pc.id
        ).order_by(
            PayrollContract.referencia_year.desc(),
            PayrollContract.referencia_month.desc()
        ).all()

        for ct in contracts:
            all_contracts.append({
                "id": ct.id,
                "matricula": pc.matricula,
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
                "created_at": (
                    ct.created_at.isoformat() if ct.created_at else None
                ),
            })

    return all_contracts


@r.get("/{client_id}/cases")
def get_client_cases(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna TODOS os casos de TODAS as matrículas do mesmo CPF.
    Isso garante que se um CPF tem múltiplas matrículas,
    todos os casos serão exibidos independente de qual registro foi acessado.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar TODOS os client_ids com o mesmo CPF
    client_ids = db.query(Client.id).filter(Client.cpf == client.cpf).all()
    client_ids_list = [c_id[0] for c_id in client_ids]

    # Buscar casos de TODOS os registros do mesmo CPF
    cases = db.query(Case).filter(
        Case.client_id.in_(client_ids_list)
    ).distinct().order_by(Case.id.desc()).all()

    # Criar dicionário para remover duplicados por ID (garantia extra)
    unique_cases = {}
    for case in cases:
        if case.id not in unique_cases:
            unique_cases[case.id] = {
                "id": case.id,
                "status": case.status or "novo",
                "entidade": getattr(case, "entidade", None),
                "referencia_competencia": getattr(
                    case, "referencia_competencia", None
                ),
                "created_at": (
                    case.created_at.isoformat()
                    if case.created_at else None
                ),
                "last_update_at": (
                    case.last_update_at.isoformat()
                    if case.last_update_at else None
                ),
                "assigned_to": (
                    case.assigned_user.name
                    if case.assigned_user else None
                ),
                "matricula": (
                    case.client.matricula
                    if case.client else None
                ),
            }

    items = list(unique_cases.values())

    return {
        "items": items,
        "total": len(items)
    }


@r.get("/{client_id}/financiamentos")
def get_client_financiamentos(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna financiamentos (linhas de folha) de um cliente específico.
    Busca por TODAS as matrículas do CPF.
    Mostra dados da referência mais recente por entidade.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar linhas de financiamento por CPF (TODAS as matrículas)
    financiamentos = db.query(PayrollLine).filter(
        PayrollLine.cpf == client.cpf
    ).order_by(
        PayrollLine.ref_year.desc(),
        PayrollLine.ref_month.desc(),
        PayrollLine.matricula.asc(),
        PayrollLine.entity_code.asc()
    ).all()

    return [
        {
            "id": line.id,
            "matricula": line.matricula,
            "financiamento_code": line.financiamento_code,
            "total_parcelas": line.total_parcelas,
            "parcelas_pagas": line.parcelas_pagas,
            "valor_parcela_ref": (
                str(line.valor_parcela_ref)
                if line.valor_parcela_ref else "0.00"
            ),
            "orgao_pagamento": line.orgao_pagamento,
            "orgao_pagamento_nome": line.orgao_pagamento_nome,
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
            "created_at": (
                line.created_at.isoformat() if line.created_at else None
            )
        } for line in financiamentos
    ]


@r.get("/{client_id}/contratos-efetivados")
def get_client_contratos_efetivados(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna contratos efetivados do cliente.
    Busca contratos de casos associados ao CPF do cliente.
    """
    from ..models import Contract, ContractAttachment

    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar TODOS os client_ids com o mesmo CPF
    client_ids = db.query(Client.id).filter(Client.cpf == client.cpf).all()
    client_ids_list = [c_id[0] for c_id in client_ids]

    # Buscar casos destes clients
    cases = db.query(Case).filter(Case.client_id.in_(client_ids_list)).all()
    case_ids = [c.id for c in cases]

    # Buscar contratos destes casos
    contracts = db.query(Contract).filter(
        Contract.case_id.in_(case_ids)
    ).order_by(Contract.created_at.desc()).all()

    result = []
    for ct in contracts:
        # Buscar anexos do contrato
        attachments = db.query(ContractAttachment).filter(
            ContractAttachment.contract_id == ct.id
        ).all()

        result.append({
            "id": ct.id,
            "case_id": ct.case_id,
            "status": ct.status,
            "total_amount": float(ct.total_amount or 0),
            "installments": ct.installments,
            "paid_installments": ct.paid_installments,
            "disbursed_at": (
                ct.disbursed_at.isoformat() if ct.disbursed_at else None
            ),
            "created_at": (
                ct.created_at.isoformat() if ct.created_at else None
            ),
            "consultoria_valor_liquido": (
                float(ct.consultoria_valor_liquido or 0)
            ),
            "attachments": [
                {
                    "id": att.id,
                    "filename": att.filename,
                    "size": att.size,
                    "mime": att.mime,
                    "created_at": (
                        att.created_at.isoformat() if att.created_at else None
                    )
                } for att in attachments
            ]
        })

    return {
        "items": result,
        "total": len(result)
    }


@r.get("/{client_id}/matriculas")
def get_client_matriculas(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna todas as matrículas associadas ao CPF do cliente.
    Busca todas as matrículas diferentes do mesmo CPF em payroll_lines.
    """
    # Buscar no sistema principal
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar todas as matrículas distintas do CPF
    matriculas = db.query(PayrollLine.matricula).filter(
        PayrollLine.cpf == client.cpf
    ).distinct().all()

    # Buscar também em clients para pegar informações completas
    clientes_matriculas = db.query(Client).filter(
        Client.cpf == client.cpf
    ).all()

    # Criar mapa de matricula -> client_id para referência
    matricula_client_map = {c.matricula: c.id for c in clientes_matriculas}

    result = []
    for (matricula,) in matriculas:
        # Contar financiamentos desta matrícula
        total_financiamentos = db.query(func.count(PayrollLine.id)).filter(
            PayrollLine.cpf == client.cpf,
            PayrollLine.matricula == matricula
        ).scalar() or 0

        # Verificar se esta matrícula está na tabela clients
        client_id_ref = matricula_client_map.get(matricula)
        is_current = (matricula == client.matricula)

        result.append({
            "matricula": matricula,
            "client_id": client_id_ref,
            "total_financiamentos": total_financiamentos,
            "is_current": is_current
        })

    # Ordenar: matrícula atual primeiro, depois por matrícula
    result.sort(
        key=lambda x: (not x["is_current"], x["matricula"])
    )

    return {
        "cpf": client.cpf,
        "total_matriculas": len(result),
        "matriculas": result
    }


@r.delete("/{client_id}")
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """
    Deleta um cliente (apenas admin).
    Verifica se o cliente tem casos antes de deletar.
    """
    # Buscar cliente
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Verificar se tem casos associados
    cases_count = db.query(Case).filter_by(
        client_id=client.id
    ).count()
    if cases_count > 0:
        raise HTTPException(
            400,
            (
                f"Não é possível excluir o cliente. "
                f"Existem {cases_count} casos associados."
            )
        )

    # Deletar cliente
    db.delete(client)
    db.commit()

    return {"ok": True, "message": "Cliente excluído com sucesso"}


@r.delete("/{client_id}/cascade")
def delete_client_cascade(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """
    Deleta um cliente e todos os casos associados (apenas admin).
    Exclusão em cascata - remove casos, anexos, eventos, simulações.
    """
    # Buscar cliente
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar casos associados
    cases = db.query(Case).filter_by(client_id=client.id).all()

    # Deletar em cascata
    for case in cases:
        # Deletar anexos
        from ..models import Attachment
        db.query(Attachment).filter_by(case_id=case.id).delete()

        # Deletar eventos
        from ..models import CaseEvent
        db.query(CaseEvent).filter_by(case_id=case.id).delete()

        # Deletar simulações
        from ..models import Simulation
        db.query(Simulation).filter_by(case_id=case.id).delete()

        # Deletar contrato se existir
        from ..models import Contract
        contract = db.query(Contract).filter_by(case_id=case.id).first()
        if contract:
            # Deletar anexos do contrato
            from ..models import ContractAttachment
            db.query(ContractAttachment).filter_by(
                contract_id=contract.id
            ).delete()

            # Deletar pagamentos
            from ..models import Payment
            db.query(Payment).filter_by(contract_id=contract.id).delete()

            # Deletar contrato
            db.delete(contract)

        # Deletar caso
        db.delete(case)

    # Deletar telefones do cliente
    db.query(ClientPhone).filter_by(client_id=client.id).delete()

    # Deletar cliente
    db.delete(client)
    db.commit()

    return {
        "ok": True,
        "message": (
            f"Cliente e {len(cases)} caso(s) associado(s) "
            f"excluído(s) com sucesso"
        ),
        "deleted_cases": len(cases)
    }


# Rotas de histórico de telefones

class PhoneUpdate(BaseModel):
    phone: str


@r.get("/{client_id}/phones")
def get_client_phones(
    client_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles(
        "admin", "supervisor", "financeiro", "calculista", "atendente",
        "fechamento"
    ))
):
    """
    Retorna o histórico de telefones de um cliente.
    Lista todos os telefones já utilizados.
    """
    # Verificar se cliente existe
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Buscar telefones
    phones = db.query(ClientPhone).filter_by(client_id=client_id).order_by(
        ClientPhone.is_primary.desc(),
        ClientPhone.created_at.desc()
    ).all()

    return {
        "items": [
            {
                "id": phone.id,
                "phone": phone.phone,
                "is_primary": phone.is_primary,
                "created_at": (
                    phone.created_at.isoformat() if phone.created_at else None
                ),
                "updated_at": (
                    phone.updated_at.isoformat() if phone.updated_at else None
                )
            } for phone in phones
        ],
        "count": len(phones)
    }


@r.post("/{client_id}/phones")
def add_or_update_client_phone(
    client_id: int,
    data: PhoneUpdate,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):
    """
    Adiciona ou atualiza o telefone principal de um cliente.
    - Remove is_primary de todos os telefones anteriores
    - Adiciona ou marca o novo telefone como is_primary=True
    - Atualiza Client.telefone_preferencial por compatibilidade
    """
    # Verificar se cliente existe
    client = db.query(Client).get(client_id)
    if not client:
        raise HTTPException(404, "Cliente não encontrado")

    # Normalizar telefone (remover espaços, caracteres especiais)
    phone_normalized = ''.join(filter(str.isdigit, data.phone))

    if not phone_normalized:
        raise HTTPException(400, "Telefone inválido")

    # Desmarcar todos os telefones anteriores como não primários
    db.query(ClientPhone).filter_by(
        client_id=client_id, is_primary=True
    ).update({"is_primary": False})

    # Verificar se o telefone já existe
    existing_phone = db.query(ClientPhone).filter_by(
        client_id=client_id, phone=phone_normalized
    ).first()

    if existing_phone:
        # Atualizar telefone existente como primário
        existing_phone.is_primary = True
        existing_phone.updated_at = datetime.utcnow()
        phone_record = existing_phone
    else:
        # Criar novo telefone
        phone_record = ClientPhone(
            client_id=client_id,
            phone=phone_normalized,
            is_primary=True
        )
        db.add(phone_record)

    # Atualizar campo legado do cliente
    client.telefone_preferencial = phone_normalized

    db.commit()
    db.refresh(phone_record)

    return {
        "id": phone_record.id,
        "phone": phone_record.phone,
        "is_primary": phone_record.is_primary,
        "created_at": (
            phone_record.created_at.isoformat()
            if phone_record.created_at else None
        ),
        "updated_at": (
            phone_record.updated_at.isoformat()
            if phone_record.updated_at else None
        )
    }


@r.delete("/{client_id}/phones/{phone_id}")
def delete_client_phone(
    client_id: int,
    phone_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "atendente"))
):
    """
    Remove um telefone do histórico do cliente (admin/supervisor/atendente).
    Não permite remover o telefone primário.
    """
    # Buscar telefone
    phone = db.query(ClientPhone).filter_by(
        id=phone_id, client_id=client_id
    ).first()
    if not phone:
        raise HTTPException(404, "Telefone não encontrado")

    # Não permitir remover telefone primário
    if phone.is_primary:
        raise HTTPException(
            400,
            "Não é possível remover o telefone principal. "
            "Defina outro telefone como principal primeiro."
        )

    # Deletar telefone
    db.delete(phone)
    db.commit()

    return {"ok": True, "message": "Telefone removido do histórico"}


class BulkDeleteRequest(BaseModel):
    ids: List[int]


@r.post("/bulk-delete")
def bulk_delete_clients(
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin"))
):
    """
    Exclusão em lote de clientes (apenas admin).
    Verifica se clientes têm casos associados antes de excluir.
    """
    if not payload.ids:
        raise HTTPException(400, "Lista de IDs vazia")

    if len(payload.ids) > 100:
        raise HTTPException(400, "Máximo de 100 clientes por vez")

    results = {
        "deleted": [],
        "failed": [],
        "total_requested": len(payload.ids)
    }

    for client_id in payload.ids:
        try:
            client = db.get(Client, client_id)
            if not client:
                results["failed"].append({
                    "id": client_id,
                    "reason": "Cliente não encontrado"
                })
                continue

            # Verificar se tem casos associados
            cases_count = db.query(Case).filter_by(
                client_id=client.id
            ).count()
            if cases_count > 0:
                results["failed"].append({
                    "id": client_id,
                    "reason": (
                        f"Cliente possui {cases_count} caso(s) associado(s)"
                    )
                })
                continue

            # Excluir telefones (CASCADE já faz isso automaticamente)
            # Mas vamos garantir explicitamente
            db.query(ClientPhone).filter_by(
                client_id=client_id
            ).delete()

            # Excluir cliente
            db.delete(client)
            results["deleted"].append(client_id)

        except Exception as e:
            results["failed"].append({
                "id": client_id,
                "reason": str(e)
            })
            print(f"Erro ao excluir cliente {client_id}: {e}")

    db.commit()

    return {
        **results,
        "success_count": len(results["deleted"]),
        "failed_count": len(results["failed"])
    }
