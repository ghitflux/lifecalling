# importe modelos que você insere durante a importação
# ex.: from app.models import Simulation, PayrollLine

from sqlalchemy.orm import Session
from .payroll_parser import parse_header, parse_rows
from ..models import PayrollClient, PayrollContract, PayrollImportBatch, PayrollImportItem, Client, Case
from decimal import Decimal
from datetime import datetime

class ImportResult(dict):
    pass


def sync_to_main_system(db: Session, payroll_client: PayrollClient, entidade_info: dict) -> Client:
    """
    Sincroniza cliente do sistema de payroll para o sistema principal e cria caso se necessário.
    """
    # Buscar ou criar cliente no sistema principal - busca única por CPF
    main_client = db.query(Client).filter(
        Client.cpf == payroll_client.cpf
    ).first()

    if not main_client:
        # Criar novo cliente no sistema principal
        main_client = Client(
            name=payroll_client.nome,
            cpf=payroll_client.cpf,
            matricula=payroll_client.matricula,
            orgao=payroll_client.orgao
        )
        db.add(main_client)
        db.flush()
    else:
        # Atualizar dados se necessário (idempotente)
        if payroll_client.nome and len(payroll_client.nome) > len(main_client.name or ""):
            main_client.name = payroll_client.nome
        # Manter primeira matrícula (não sobrescrever se já existe)
        if not getattr(main_client, "matricula", None):
            main_client.matricula = payroll_client.matricula
        # Atualizar órgão pagador se fornecido
        if payroll_client.orgao:
            main_client.orgao = payroll_client.orgao

    # Verificar se já existe caso aberto para este cliente (idempotente)
    OPEN_STATUSES = ["novo", "disponivel", "em_atendimento", "calculista",
                     "calculista_pendente", "financeiro", "fechamento_pendente"]

    existing_case = db.query(Case).filter(
        Case.client_id == main_client.id,
        Case.status.in_(OPEN_STATUSES)
    ).order_by(Case.id.desc()).first()

    if not existing_case:
        # Criar novo caso com status "disponivel"
        new_case = Case(
            client_id=main_client.id,
            status="disponivel",
            entidade=entidade_info.get("entidade_name"),
            referencia_competencia=f"{entidade_info.get('ref_month'):02d}/{entidade_info.get('ref_year')}",
            created_at=datetime.utcnow(),
            last_update_at=datetime.utcnow()
        )
        db.add(new_case)
        db.flush()  # IMPORTANTE: Garantir que o caso seja visível para próximas linhas do mesmo CPF
    else:
        # Reaproveitar caso existente: atualizar apenas o timestamp
        existing_case.last_update_at = datetime.utcnow()

    return main_client


def upsert_client(db: Session, *, cpf: str, matricula: str, nome: str, orgao: str) -> PayrollClient:
    """
    Insere ou atualiza cliente usando chave primária (cpf, matricula).
    Mantém o nome mais completo e atualiza o órgão.
    """
    cli = db.query(PayrollClient).filter_by(cpf=cpf, matricula=matricula).one_or_none()
    if cli:
        # Cliente existe - atualizar se necessário
        if nome and len(nome) > len(cli.nome):
            cli.nome = nome
        cli.orgao = orgao or cli.orgao
        db.flush()
        return cli

    # Cliente novo
    cli = PayrollClient(cpf=cpf, matricula=matricula, nome=nome, orgao=orgao)
    db.add(cli)
    db.flush()
    return cli


def upsert_contract(db: Session, *, client_id: int, entidade_code: str, entidade_name: str,
                    mm: int, yy: int, valor_parcela: Decimal, total: int, pago: int,
                    cargo: str, fin: str, orgao_codigo: str, lanc: str) -> PayrollContract:
    """
    Insere ou atualiza contrato usando chave primária
    (client_id, entidade_code, referencia_month, referencia_year).
    """
    ct = (db.query(PayrollContract)
            .filter_by(client_id=client_id, entidade_code=entidade_code,
                       referencia_month=mm, referencia_year=yy)
            .one_or_none())

    if ct:
        # Contrato existe - atualizar valores
        ct.valor_parcela = valor_parcela
        ct.total_parcelas = total
        ct.parcelas_pagas = pago
        ct.cargo = cargo
        ct.fin = fin
        ct.orgao_codigo = orgao_codigo
        ct.lanc = lanc
        db.flush()
        return ct

    # Contrato novo
    ct = PayrollContract(
        client_id=client_id,
        entidade_code=entidade_code,
        entidade_name=entidade_name,
        referencia_month=mm,
        referencia_year=yy,
        valor_parcela=valor_parcela,
        total_parcelas=total,
        parcelas_pagas=pago,
        cargo=cargo,
        fin=fin,
        orgao_codigo=orgao_codigo,
        lanc=lanc,
    )
    db.add(ct)
    db.flush()
    return ct


def import_payroll_text(db: Session, *, text: str, file_name: str, user_id: int | None = None) -> ImportResult:
    """
    Importa arquivo TXT iNETConsig normalizado.

    Args:
        db: Sessão do banco
        text: Conteúdo do arquivo
        file_name: Nome do arquivo
        user_id: ID do usuário que está importando

    Returns:
        ImportResult com estatísticas da importação
    """
    # Parse do cabeçalho
    hdr = parse_header(text)

    # Criar lote de importação
    batch = PayrollImportBatch(
        file_name=file_name,
        entidade_code=hdr.entidade_code,
        entidade_name=hdr.entidade_name,
        referencia_month=hdr.ref_month,
        referencia_year=hdr.ref_year,
        processed_by=user_id,
    )
    db.add(batch)
    db.flush()

    # Contadores
    counters = dict(clients_created=0, clients_updated=0, contracts_upserted=0, errors=0)

    # Processar cada linha
    for row in parse_rows(text):
        try:
            # Verificar se cliente já existe
            cli_before = db.query(PayrollClient).filter_by(cpf=row.cpf, matricula=row.matricula).one_or_none()

            # Upsert cliente
            cli = upsert_client(
                db,
                cpf=row.cpf,
                matricula=row.matricula,
                nome=row.nome,
                orgao=row.orgao_pagto  # Código do órgão pagador (não nome do banco)
            )

            # A criação/atualização de cliente e reaproveitamento de case é feita por
            # sync_to_main_system (linha 195). Chamada a ensure_client_case foi removida
            # para evitar duplicidades por CPF.

            # Contabilizar ação no cliente
            if cli_before is None:
                counters['clients_created'] += 1
            else:
                counters['clients_updated'] += 1

            # Sincronizar com sistema principal de casos
            sync_to_main_system(db, cli, {
                'entidade_name': hdr.entidade_name,
                'ref_month': hdr.ref_month,
                'ref_year': hdr.ref_year
            })

            # Upsert contrato
            ct = upsert_contract(
                db,
                client_id=cli.id,
                entidade_code=hdr.entidade_code,
                entidade_name=hdr.entidade_name,
                mm=hdr.ref_month,
                yy=hdr.ref_year,
                valor_parcela=row.valor_parcela,
                total=row.total,
                pago=row.pago,
                cargo=row.cargo,
                fin=row.fin,
                orgao_codigo=row.orgao,
                lanc=row.lanc,
            )
            counters['contracts_upserted'] += 1

            # Registrar item de importação
            db.add(PayrollImportItem(
                batch_id=batch.id,
                client_id=cli.id,
                contract_id=ct.id,
                raw_line=None  # Não armazenamos a linha completa por LGPD
            ))

        except Exception as e:
            counters['errors'] += 1
            # Registrar erro sem expor dados sensíveis
            db.add(PayrollImportItem(
                batch_id=batch.id,
                client_id=None,
                contract_id=None,
                raw_line=f"ERRO: {str(e)[:100]}"
            ))

    db.commit()

    return ImportResult(
        batch_id=batch.id,
        **counters,
        entidade_code=hdr.entidade_code,
        entidade_name=hdr.entidade_name,
        ref=f"{hdr.ref_month:02d}/{hdr.ref_year}"
    )
