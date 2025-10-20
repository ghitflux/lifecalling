"""
Rota única de importação para arquivos iNETConsig.

Este módulo implementa uma rota unificada que processa arquivos
de folha de pagamento no formato iNETConsig, criando clientes,
registrando financiamentos e gerando atendimentos automaticamente.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import ImportBatch, PayrollLine, Client, Case, User
from ..services.payroll_inetconsig_parser import (
    parse_inetconsig_file,
    validate_inetconsig_content,
    get_file_preview
)
from datetime import datetime
from collections import defaultdict
import logging
import os
import shutil
from pathlib import Path

logger = logging.getLogger(__name__)

r = APIRouter(prefix="/imports", tags=["imports"])

# Diretório para armazenar arquivos importados
IMPORTS_DIR = Path("uploads/imports")
IMPORTS_DIR.mkdir(parents=True, exist_ok=True)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def calculate_status_summary(lines: list) -> dict:
    """
    Calcula resumo dos status para um cliente, agrupando por código FIN.

    Estrutura de retorno:
    {
        "total_lines": 5,
        "financiamentos": {
            "6490": {  # Código FIN
                "07/2025": {
                    "valor_parcela": 458.04,
                    "status": "1",
                    "status_description": "Lançado e Efetivado",
                    "parcelas_pagas": 24,
                    "total_parcelas": 88,
                    "entity_name": "BANCO SANTANDER S.A"
                },
                "08/2025": {...}
            },
            "7821": {...}
        },
        "status_counts": {...},
        "has_problems": False,
        "has_success": True,
        "priority_score": 5
    }

    Args:
        lines: Lista de linhas do cliente

    Returns:
        Dict com contadores e resumo dos status agrupados por FIN
    """
    summary = {
        "total_lines": len(lines),
        "financiamentos": {},  # Agrupado por FIN
        "status_counts": {},
        "has_problems": False,
        "has_success": False,
        "priority_score": 0
    }

    problem_statuses = {"2", "3", "5", "6", "S"}
    success_statuses = {"1", "4"}

    for line in lines:
        status = line["status_code"]
        fin_code = line.get("financiamento_code", "")
        ref_key = f"{line.get('ref_month', 0):02d}/{line.get('ref_year', 0)}"

        # Agrupar por código FIN
        if fin_code not in summary["financiamentos"]:
            summary["financiamentos"][fin_code] = {}

        # Adicionar dados deste mês/ano
        summary["financiamentos"][fin_code][ref_key] = {
            "valor_parcela": float(line.get("valor_parcela_ref", 0)),
            "status": status,
            "status_description": line.get("status_description", ""),
            "parcelas_pagas": int(line.get("parcelas_pagas", 0)),
            "total_parcelas": int(line.get("total_parcelas", 0)),
            "entity_name": line.get("entity_name", ""),
            "orgao": line.get("orgao", ""),
            "orgao_pagamento": line.get("orgao_pagamento", ""),
            "orgao_pagamento_nome": line.get("orgao_pagamento_nome", "")
        }

        # Contar status globais
        if status not in summary["status_counts"]:
            summary["status_counts"][status] = {
                "count": 0,
                "description": line["status_description"]
            }
        summary["status_counts"][status]["count"] += 1

        if status in problem_statuses:
            summary["has_problems"] = True
        if status in success_statuses:
            summary["has_success"] = True

    # Calcular prioridade (problemas = maior prioridade)
    if summary["has_problems"]:
        summary["priority_score"] = 10
    elif summary["has_success"]:
        summary["priority_score"] = 5
    else:
        summary["priority_score"] = 1

    return summary


def upsert_client(db: Session, cpf: str, matricula: str, nome: str, orgao: str = None,
                  orgao_pgto_code: str = None, orgao_pgto_name: str = None,
                  status_desconto: str = None, status_legenda: str = None) -> Client:
    """
    Cria ou atualiza um cliente usando chave única por CPF.
    Múltiplas matrículas do mesmo CPF compartilham o mesmo registro de cliente.

    Args:
        db: Sessão do banco
        cpf: CPF normalizado (11 dígitos)
        matricula: Matrícula do funcionário (primeira vista é armazenada)
        nome: Nome completo
        orgao: Órgão/entidade (opcional)
        orgao_pgto_code: Código do órgão pagador (opcional)
        orgao_pgto_name: Nome do órgão pagador (opcional)
        status_desconto: Status do desconto (opcional)
        status_legenda: Descrição do status (opcional)

    Returns:
        Cliente criado ou atualizado
    """
    # Gerar chave normalizada (mantido para compatibilidade)
    cpf_matricula = f"{cpf}|{matricula}"

    # Buscar cliente por CPF único (não por CPF+matrícula)
    client = db.query(Client).filter(
        Client.cpf == cpf
    ).first()

    if client:
        # Atualizar dados se necessário (idempotente)
        if nome and len(nome) > len(client.name or ""):
            client.name = nome
        # Manter primeira matrícula (não sobrescrever)
        if not getattr(client, "matricula", None):
            client.matricula = matricula
        # Usar código do órgão pagador (empregador), não o código do financiamento
        if orgao_pgto_name:
            client.orgao = orgao_pgto_name
        elif orgao_pgto_code:
            client.orgao = orgao_pgto_code
        if orgao_pgto_code:
            client.orgao_pgto_code = orgao_pgto_code
        if orgao_pgto_name:
            client.orgao_pgto_name = orgao_pgto_name
        if status_desconto:
            client.status_desconto = status_desconto
        if status_legenda:
            client.status_legenda = status_legenda
        client.cpf_matricula = cpf_matricula
        logger.debug(f"Cliente atualizado: CPF {cpf}")
    else:
        # Criar novo cliente
        client = Client(
            cpf=cpf,
            matricula=matricula,
            name=nome,
            orgao=orgao_pgto_name or orgao_pgto_code,  # Órgão pagador (empregador)
            orgao_pgto_code=orgao_pgto_code,
            orgao_pgto_name=orgao_pgto_name,
            status_desconto=status_desconto,
            status_legenda=status_legenda,
            cpf_matricula=cpf_matricula
        )
        db.add(client)
        db.flush()
        logger.info(f"Cliente criado: {cpf} - {matricula}")

    return client


def create_case_for_client(db: Session, client: Client, batch: ImportBatch,
                          status_summary: dict) -> Case:
    """
    Cria um novo caso na esteira para o cliente.
    IMPORTANTE: Garante apenas 1 caso ativo por CPF (não por client_id).

    Args:
        db: Sessão do banco
        client: Cliente
        batch: Lote de importação
        status_summary: Resumo dos status do cliente

    Returns:
        Caso criado ou atualizado
    """
    # Buscar TODOS os client_ids com o mesmo CPF
    client_ids_with_same_cpf = db.query(Client.id).filter(
        Client.cpf == client.cpf
    ).all()
    client_ids_list = [c_id[0] for c_id in client_ids_with_same_cpf]

    # Verificar se já existe caso aberto para QUALQUER matrícula deste CPF
    existing_case = db.query(Case).filter(
        Case.client_id.in_(client_ids_list),
        Case.entity_code == batch.entity_code,
        Case.ref_month == batch.ref_month,
        Case.ref_year == batch.ref_year,
        Case.status.in_(["novo", "em_atendimento", "calculista_pendente"])
    ).first()

    if existing_case:
        # Atualizar caso existente com novos dados
        existing_case.payroll_status_summary = status_summary
        existing_case.import_batch_id_new = batch.id
        existing_case.last_update_at = datetime.utcnow()
        logger.info(f"Caso #{existing_case.id} atualizado (CPF {client.cpf} já tinha caso ativo)")
        return existing_case

    # Verificação adicional: garantir que NÃO exista NENHUM caso ativo do CPF
    any_active_case = db.query(Case).filter(
        Case.client_id.in_(client_ids_list),
        Case.status.in_(["novo", "disponivel", "em_atendimento", "calculista", "calculista_pendente", "calculo_aprovado", "financeiro", "fechamento_pendente", "fechamento_aprovado"])
    ).first()

    if any_active_case:
        # Se já existe um caso ativo (mesmo de outra referência), atualizar
        logger.warning(f"⚠️ CPF {client.cpf} já tem caso #{any_active_case.id} ativo - não será criado novo caso")
        any_active_case.payroll_status_summary = status_summary
        any_active_case.import_batch_id_new = batch.id
        any_active_case.last_update_at = datetime.utcnow()
        return any_active_case

    # Criar novo caso apenas se NÃO existir nenhum caso ativo do CPF
    new_case = Case(
        client_id=client.id,
        status="novo",
        source="import",
        entity_code=batch.entity_code,
        ref_month=batch.ref_month,
        ref_year=batch.ref_year,
        import_batch_id_new=batch.id,
        payroll_status_summary=status_summary,
        last_update_at=datetime.utcnow(),

        # Campos legados para compatibilidade
        entidade=batch.entity_name,
        referencia_competencia=f"{batch.ref_month:02d}/{batch.ref_year}"
    )
    db.add(new_case)
    db.flush()  # Garantir que o ID seja gerado
    logger.info(f"Novo caso criado: {new_case.id} para cliente {client.id}")
    return new_case


@r.post("")
async def import_payroll_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista"))
):
    """
    Importa arquivo de folha de pagamento TXT e processa dados.

    Fluxo:
    1. Valida formato do arquivo
    2. Faz parse dos dados com legenda de status
    3. Cria/atualiza clientes únicos
    4. Registra linhas de financiamento
    5. Gera casos na esteira para cada cliente

    Returns:
        Estatísticas da importação e IDs criados
    """
    if not file.filename or not file.filename.lower().endswith(".txt"):
        raise HTTPException(400, "Arquivo deve ser .txt no formato de folha de pagamento")

    logger.info(f"Iniciando importação do arquivo: {file.filename}")

    try:
        # Ler conteúdo do arquivo com encoding correto para arquivos iNETConsig
        raw_content = await file.read()

        # Tentar múltiplos encodings comuns em sistemas Windows/governamentais
        for encoding in ["latin-1", "cp1252", "iso-8859-1", "utf-8"]:
            try:
                content = raw_content.decode(encoding)
                if content.strip():
                    logger.info(f"Arquivo decodificado com sucesso usando {encoding}")
                    break
            except (UnicodeDecodeError, AttributeError):
                continue
        else:
            # Fallback: usar latin-1 com errors="replace"
            content = raw_content.decode("latin-1", errors="replace")
            logger.warning("Usando latin-1 com replace como fallback")

        if not content.strip():
            raise HTTPException(400, "Arquivo vazio")

        # Validar formato do arquivo
        validation_errors = validate_inetconsig_content(content)
        if validation_errors:
            raise HTTPException(400, f"Formato inválido: {'; '.join(validation_errors)}")

        # Parse do arquivo
        meta, lines, parse_stats = parse_inetconsig_file(content)

        if not lines:
            raise HTTPException(400, "Nenhuma linha válida encontrada no arquivo")

        logger.info(f"Parse concluído: {len(lines)} linhas, {parse_stats['unique_clients']} clientes únicos")

        # Criar lote de importação
        batch = ImportBatch(
            entity_code=meta["entity_code"],
            entity_name=meta["entity_name"],
            ref_month=meta["ref_month"],
            ref_year=meta["ref_year"],
            generated_at=meta.get("generated_at", datetime.utcnow()),
            created_by=user.id,
            filename=file.filename,
            total_lines=len(lines),
            processed_lines=0,
            error_lines=0
        )
        db.add(batch)
        db.flush()

        # Salvar arquivo físico no sistema
        try:
            # Gerar nome único para o arquivo: batch_id_timestamp_filename.txt
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"batch_{batch.id}_{timestamp}_{file.filename}"
            file_path = IMPORTS_DIR / safe_filename

            # Salvar conteúdo do arquivo
            with open(file_path, "wb") as f:
                f.write(raw_content)

            # Atualizar batch com o caminho do arquivo
            batch.file_path = str(file_path)
            db.flush()

            logger.info(f"Arquivo salvo em: {file_path}")
        except Exception as e:
            logger.warning(f"Erro ao salvar arquivo físico: {e}")
            # Não falhar a importação se não conseguir salvar o arquivo

        # Contadores para estatísticas
        counters = {
            "clients_created": 0,
            "clients_updated": 0,
            "lines_created": 0,
            "cases_created": 0,
            "cases_updated": 0,
            "cases_reopened": 0,
            "errors": 0
        }

        # Agrupar linhas por cliente (CPF + Matrícula)
        client_lines = defaultdict(list)
        for line in lines:
            key = (line["cpf"], line["matricula"])
            client_lines[key].append(line)

        # Processar todos os clientes (sem limite artificial)
        total_clients = len(client_lines)

        logger.info(f"Total de clientes únicos no arquivo: {total_clients}")

        # Processar TODOS os clientes com commit incremental a cada 500 para performance
        BATCH_SIZE = 500
        processed_count = 0

        for (cpf, matricula), client_line_group in client_lines.items():
            processed_count += 1
            try:
                # Usar dados da primeira linha para cliente
                first_line = client_line_group[0]

                # Verificar se cliente existe (busca única por CPF)
                client_exists = db.query(Client).filter(
                    Client.cpf == cpf
                ).first() is not None

                # Upsert cliente com dados da última referência
                client = upsert_client(
                    db, cpf, matricula,
                    first_line["nome"],
                    meta["entity_name"],
                    orgao_pgto_code=first_line.get("orgao_pagamento"),
                    orgao_pgto_name=first_line.get("orgao_pagamento_nome"),
                    status_desconto=first_line.get("status_code"),
                    status_legenda=first_line.get("status_description")
                )

                if client_exists:
                    counters["clients_updated"] += 1
                else:
                    counters["clients_created"] += 1

                # Calcular resumo de status para este cliente
                status_summary = calculate_status_summary(client_line_group)

                # Criar/atualizar caso na esteira (1 caso por CPF - REGRA ABSOLUTA)
                try:
                    from ..models import CaseEvent, now_brt

                    # Status considerados "abertos" (não criar novos casos se já houver um aberto)
                    OPEN_STATUSES = ["novo", "disponivel", "em_atendimento", "calculista",
                                     "calculista_pendente", "financeiro", "fechamento_pendente",
                                     "calculo_aprovado", "fechamento_aprovado"]

                    # Status que podem ser reabertos (EXCLUÍDO: caso_cancelado)
                    # Casos cancelados deliberadamente NÃO devem ser reabertos
                    CLOSED_STATUSES = ["encerrado", "sem_contato", "arquivado"]

                    # Verificar se caso aberto já existe para este cliente
                    existing_case = db.query(Case).filter(
                        Case.client_id == client.id,
                        Case.status.in_(OPEN_STATUSES)
                    ).order_by(Case.id.desc()).first()

                    if existing_case:
                        # Reaproveitar caso existente: apenas atualizar
                        existing_case.payroll_status_summary = status_summary
                        existing_case.import_batch_id_new = batch.id
                        existing_case.ref_month = batch.ref_month
                        existing_case.ref_year = batch.ref_year
                        existing_case.last_update_at = datetime.utcnow()
                        case = existing_case
                        counters["cases_updated"] += 1
                        logger.info(f"Caso {case.id} atualizado para cliente {client.id}")
                    else:
                        # Verificar se existe caso encerrado/sem_contato para REABRIR
                        closed_case = db.query(Case).filter(
                            Case.client_id == client.id,
                            Case.status.in_(CLOSED_STATUSES)
                        ).order_by(Case.id.desc()).first()

                        if closed_case:
                            # REABRIR caso fechado (mantém histórico)
                            old_status = closed_case.status
                            closed_case.status = "novo"
                            closed_case.payroll_status_summary = status_summary
                            closed_case.import_batch_id_new = batch.id
                            closed_case.ref_month = batch.ref_month
                            closed_case.ref_year = batch.ref_year
                            closed_case.last_update_at = datetime.utcnow()
                            # Limpar atribuição antiga
                            closed_case.assigned_user_id = None
                            closed_case.assigned_at = None
                            closed_case.assignment_expires_at = None

                            # Criar evento de reabertura
                            reopen_event = CaseEvent(
                                case_id=closed_case.id,
                                type="case.reopened",
                                payload={
                                    "previous_status": old_status,
                                    "new_status": "novo",
                                    "reason": "Nova importação de dados",
                                    "batch_id": batch.id,
                                    "ref_month": batch.ref_month,
                                    "ref_year": batch.ref_year
                                },
                                created_at=now_brt()
                            )
                            db.add(reopen_event)

                            case = closed_case
                            counters["cases_reopened"] += 1
                            logger.info(f"Caso {case.id} REABERTO (era {old_status}) para cliente {client.id}")
                        else:
                            # Criar novo caso
                            case = create_case_for_client(db, client, batch, status_summary)
                            counters["cases_created"] += 1
                            logger.info(f"Novo caso {case.id} criado para cliente {client.id}")

                except Exception as case_error:
                    logger.error(f"Erro ao criar/atualizar caso para cliente {client.id}: {case_error}")
                    # Não falhar a importação por causa do caso, mas registrar erro
                    counters["errors"] += 1

                # Registrar todas as linhas do cliente
                for line in client_line_group:
                    try:
                        # Verificar se linha já existe (evitar duplicatas)
                        existing_line = db.query(PayrollLine).filter(
                            PayrollLine.cpf == line["cpf"],
                            PayrollLine.matricula == line["matricula"],
                            PayrollLine.financiamento_code == line["financiamento_code"],
                            PayrollLine.ref_month == line["ref_month"],
                            PayrollLine.ref_year == line["ref_year"]
                        ).first()

                        if existing_line:
                            # Atualizar linha existente
                            existing_line.status_code = line["status_code"]
                            existing_line.status_description = line["status_description"]
                            existing_line.orgao = line["orgao"]
                            existing_line.lanc = line["lanc"]
                            existing_line.total_parcelas = line["total_parcelas"]
                            existing_line.parcelas_pagas = line["parcelas_pagas"]
                            existing_line.valor_parcela_ref = line["valor_parcela_ref"]
                            existing_line.orgao_pagamento = line["orgao_pagamento"]
                            existing_line.orgao_pagamento_nome = line.get("orgao_pagamento_nome", "")
                            logger.info(f"Linha atualizada para CPF {cpf}, FIN {line['financiamento_code']}")
                        else:
                            # Criar nova linha com campos corretos
                            payroll_line = PayrollLine(
                                batch_id=batch.id,
                                cpf=line["cpf"],
                                matricula=line["matricula"],
                                nome=line.get("nome", ""),
                                cargo=line.get("cargo", ""),
                                status_code=line["status_code"],
                                status_description=line["status_description"],
                                financiamento_code=line["financiamento_code"],
                                orgao=line["orgao"],
                                lanc=line["lanc"],
                                total_parcelas=line["total_parcelas"],
                                parcelas_pagas=line["parcelas_pagas"],
                                valor_parcela_ref=line["valor_parcela_ref"],
                                orgao_pagamento=line["orgao_pagamento"],
                                orgao_pagamento_nome=line.get("orgao_pagamento_nome", ""),
                                entity_code=line["entity_code"],
                                entity_name=line["entity_name"],
                                ref_month=line["ref_month"],
                                ref_year=line["ref_year"],
                                line_number=line.get("line_number")
                            )
                            db.add(payroll_line)
                            counters["lines_created"] += 1
                            logger.info(f"Nova linha criada para CPF {cpf}, FIN {line['financiamento_code']}")

                    except Exception as line_error:
                        logger.error(f"Erro ao salvar linha CPF {cpf}, FIN {line.get('financiamento_code')}: {line_error}")
                        counters["errors"] += 1
                        # Não fazer raise para continuar processamento

                # Commit incremental a cada 500 clientes para performance
                if processed_count % BATCH_SIZE == 0:
                    db.commit()
                    logger.info(f"Commit incremental: {processed_count}/{total_clients} clientes processados")

            except Exception as e:
                db.rollback()
                counters["errors"] += 1
                logger.error(f"Erro ao processar cliente {cpf}-{matricula}: {e}")
                # Continuar com próximo cliente

        # Commit final para clientes restantes
        try:
            db.commit()
            logger.info(f"Commit final: {processed_count} clientes processados")
        except Exception as e:
            logger.error(f"Erro no commit final: {e}")
            db.rollback()

        # Atualizar estatísticas do batch
        try:
            # Salvar ID do batch antes de qualquer operação
            batch_id = batch.id

            # Usar query update direta para evitar problemas de sessão
            db.execute(
                text("UPDATE import_batches SET processed_lines = :processed, error_lines = :errors WHERE id = :id"),
                {
                    "processed": counters["lines_created"],
                    "errors": counters["errors"],
                    "id": batch_id
                }
            )
            db.commit()
            logger.info(f"Estatísticas do batch {batch_id} atualizadas")
        except Exception as batch_error:
            logger.error(f"Erro ao atualizar estatísticas do batch: {batch_error}")
            db.rollback()

        logger.info(f"Importação concluída: {counters}")

        # Calcular estatísticas adicionais
        success_rate = (counters["lines_created"] / len(lines) * 100) if len(lines) > 0 else 0

        # Resposta com estatísticas detalhadas
        response = {
            "success": True,
            "batch_id": batch.id,
            "counters": counters,
            "parse_stats": parse_stats,
            "metadata": {
                "entity_code": meta["entity_code"],
                "entity_name": meta["entity_name"],
                "reference": f"{meta['ref_month']:02d}/{meta['ref_year']}",
                "generated_at": meta["generated_at"].isoformat(),
                "filename": file.filename
            },
            "summary": {
                "total_clients_processed": total_clients,
                "total_lines_in_file": len(lines),
                "success_rate": f"{success_rate:.1f}%",
                "clients_created": counters["clients_created"],
                "clients_updated": counters["clients_updated"],
                "cases_created": counters["cases_created"],
                "errors": counters["errors"]
            }
        }

        # Adicionar informações contextuais
        messages = []
        if total_clients > 1000:
            messages.append(f"✓ Arquivo grande processado: {total_clients} clientes únicos")

        if counters["errors"] > 0:
            messages.append(f"⚠ {counters['errors']} linhas com erro foram ignoradas")

        if counters["clients_updated"] > 0:
            messages.append(f"↻ {counters['clients_updated']} clientes foram atualizados")

        if counters["cases_created"] > 0:
            messages.append(f"✓ {counters['cases_created']} novos casos criados na esteira")

        if counters["cases_reopened"] > 0:
            messages.append(f"🔄 {counters['cases_reopened']} casos reabertos (estavam encerrados/sem contato)")

        if messages:
            response["info"] = " • ".join(messages)

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro durante importação: {e}")
        raise HTTPException(500, f"Erro interno: {str(e)}")


@r.get("/preview")
async def preview_file(
    file: UploadFile = File(...),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista"))
):
    """
    Faz uma prévia do arquivo de folha de pagamento sem importar os dados.
    Útil para validação antes da importação completa.
    """
    try:
        content = (await file.read()).decode("utf-8", errors="ignore")

        # Validar formato
        validation_errors = validate_inetconsig_content(content)
        if validation_errors:
            return {
                "valid": False,
                "errors": validation_errors
            }

        # Obter prévia
        preview = get_file_preview(content)

        return {
            "valid": True,
            "preview": preview
        }

    except Exception as e:
        logger.error(f"Erro na prévia do arquivo: {e}")
        raise HTTPException(500, f"Erro ao processar arquivo: {str(e)}")


@r.get("/batches")
def list_import_batches(
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Lista os lotes de importação mais recentes."""
    batches = db.query(ImportBatch).order_by(ImportBatch.id.desc()).limit(20).all()

    result = []
    for batch in batches:
        # Buscar nome do usuário
        creator = db.query(User).filter(User.id == batch.created_by).first()

        # Contar total de clientes únicos desta importação
        from sqlalchemy import func, distinct
        total_clients = (
            db.query(func.count(distinct(PayrollLine.cpf)))
            .filter(PayrollLine.batch_id == batch.id)
            .scalar() or 0
        )

        result.append({
            "id": batch.id,
            "entity_code": batch.entity_code,
            "entity_name": batch.entity_name,
            "reference": f"{batch.ref_month:02d}/{batch.ref_year}",
            "filename": batch.filename,
            "file_path": batch.file_path,
            "has_file": batch.file_path is not None and os.path.exists(batch.file_path) if batch.file_path else False,
            "total_lines": batch.total_lines,
            "processed_lines": batch.processed_lines,
            "error_lines": batch.error_lines,
            "total_clients": total_clients,  # Total de clientes únicos
            "created_at": batch.created_at.isoformat(),
            "created_by": creator.name if creator else "Sistema",
            "generated_at": batch.generated_at.isoformat()
        })

    return {"batches": result}


@r.get("/batches/{batch_id}")
def get_import_batch_details(
    batch_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """Retorna detalhes de um lote específico de importação."""
    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(404, "Lote não encontrado")

    # Estatísticas das linhas
    lines_stats = db.query(
        PayrollLine.status_code,
        func.count(PayrollLine.id).label("count")
    ).filter(PayrollLine.batch_id == batch_id).group_by(PayrollLine.status_code).all()

    # Contagem de casos criados
    cases_count = db.query(func.count(Case.id)).filter(
        Case.import_batch_id_new == batch_id
    ).scalar() or 0

    # Buscar usuário criador
    creator = db.query(User).filter(User.id == batch.created_by).first()

    return {
        "batch": {
            "id": batch.id,
            "entity_code": batch.entity_code,
            "entity_name": batch.entity_name,
            "reference": f"{batch.ref_month:02d}/{batch.ref_year}",
            "filename": batch.filename,
            "file_path": batch.file_path,
            "has_file": batch.file_path is not None and os.path.exists(batch.file_path) if batch.file_path else False,
            "total_lines": batch.total_lines,
            "processed_lines": batch.processed_lines,
            "error_lines": batch.error_lines,
            "created_at": batch.created_at.isoformat(),
            "created_by": creator.name if creator else "Sistema",
            "generated_at": batch.generated_at.isoformat()
        },
        "statistics": {
            "status_distribution": [
                {"status": stat.status_code, "count": stat.count}
                for stat in lines_stats
            ],
            "cases_created": cases_count
        }
    }


@r.get("/batches/{batch_id}/download")
async def download_import_file(
    batch_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor", "financeiro", "calculista"))
):
    """
    Faz o download do arquivo original de importação.
    """
    from fastapi.responses import FileResponse

    batch = db.query(ImportBatch).filter(ImportBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(404, "Lote não encontrado")

    if not batch.file_path or not os.path.exists(batch.file_path):
        raise HTTPException(404, "Arquivo não encontrado no sistema")

    # Retornar o arquivo para download
    filename = batch.filename or f"import_{batch_id}.txt"
    return FileResponse(
        path=batch.file_path,
        media_type="text/plain",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )