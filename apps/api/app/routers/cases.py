from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from typing import List
from datetime import datetime, timedelta
import os
import shutil

from sqlalchemy import or_
from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Case, Client, CaseEvent, Contract, ContractAttachment
from ..services.case_scheduler import CaseScheduler
from ..constants import enrich_banks_with_names
from ..config import settings
from ..events import eventbus  # uso consistente do eventbus

r = APIRouter(prefix="/cases", tags=["cases"])


class PageOut(BaseModel):
    items: list[dict]
    total: int
    page: int
    page_size: int


class CasePatch(BaseModel):
    telefone_preferencial: str | None = None
    numero_cliente: str | None = None
    observacoes: str | None = None

    # Dados bancários
    banco: str | None = None
    agencia: str | None = None
    conta: str | None = None
    chave_pix: str | None = None
    tipo_chave_pix: str | None = None


class AssigneeUpdate(BaseModel):
    assignee_id: int


class BulkDeleteRequest(BaseModel):
    ids: List[int]


class ExpiryUpdate(BaseModel):
    # Define uma nova data de expiração absoluta em ISO UTC (ex.: 2024-01-31T12:00:00Z)
    expires_at_iso: str | None = None
    # Força expiração imediata: define expiração para agora - 1 segundo
    force_expired: bool = False


@r.get("/{case_id}")
def get_case(case_id: int, user=Depends(get_current_user)):
    from ..models import Simulation, Attachment
    from app.models import PayrollLine  # mantém import absoluto que você já usa

    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        # Simulação mais recente
        simulation = (
            db.query(Simulation)
            .filter(Simulation.case_id == case_id)
            .order_by(Simulation.id.desc())
            .first()
        )

        # Anexos
        attachments = db.query(Attachment).filter(Attachment.case_id == case_id).all()

        # Buscar todas as matrículas do CPF
        from app.models import PayrollClient
        matriculas = (
            db.query(PayrollClient.matricula, PayrollClient.orgao)
            .filter(PayrollClient.cpf == c.client.cpf)
            .distinct()
            .all()
        )

        # Financiamentos do cliente (todas as matrículas do CPF)
        financiamentos = (
            db.query(PayrollLine)
            .filter(
                PayrollLine.cpf == c.client.cpf,
            )
            .order_by(
                PayrollLine.ref_year.desc(),
                PayrollLine.ref_month.desc(),
                PayrollLine.entity_code.asc(),
            )
            .all()
        )

        result = {
            "id": c.id,
            "status": c.status,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
            "assigned_to": c.assigned_user.name if c.assigned_user else None,
            "entidade": getattr(c, "entidade", None),
            "referencia_competencia": getattr(c, "referencia_competencia", None),
            "importado_em": c.importado_em.isoformat()
            if getattr(c, "importado_em", None)
            else None,
            "client": {
                "id": c.client.id,
                "name": c.client.name,
                "cpf": c.client.cpf,
                "matricula": c.client.matricula,  # Primeira matrícula (legado)
                "matriculas": [  # Todas as matrículas do CPF
                    {"matricula": m.matricula, "orgao": m.orgao}
                    for m in matriculas
                ],
                "orgao": getattr(c.client, "orgao", None),
                "telefone_preferencial": getattr(
                    c.client, "telefone_preferencial", None
                ),
                "numero_cliente": getattr(c.client, "numero_cliente", None),
                "observacoes": getattr(c.client, "observacoes", None),
                # Dados bancários
                "banco": getattr(c.client, "banco", None),
                "agencia": getattr(c.client, "agencia", None),
                "conta": getattr(c.client, "conta", None),
                "chave_pix": getattr(c.client, "chave_pix", None),
                "tipo_chave_pix": getattr(c.client, "tipo_chave_pix", None),
                # Financiamentos (todas as matrículas do CPF)
                "financiamentos": [
                    {
                        "id": line.id,
                        "matricula": line.matricula,  # Identificar de qual matrícula é
                        "financiamento_code": line.financiamento_code,
                        "total_parcelas": line.total_parcelas,
                        "parcelas_pagas": line.parcelas_pagas,
                        "valor_parcela_ref": str(line.valor_parcela_ref)
                        if line.valor_parcela_ref
                        else "0.00",
                        "orgao_pagamento": line.orgao_pagamento,
                        "orgao_pagamento_nome": line.orgao_pagamento_nome,
                        "entity_name": line.entity_name,
                        "status_code": line.status_code,
                        "status_description": line.status_description,
                        "referencia": f"{line.ref_month:02d}/{line.ref_year}",
                        "entity_code": line.entity_code,
                        "cargo": line.cargo,
                        "orgao": line.orgao,
                        "lanc": line.lanc,
                    }
                    for line in financiamentos
                ],
            },
        }

        if simulation:
            result["simulation"] = {
                "id": simulation.id,
                "status": simulation.status,
                "totals": {
                    "valorParcelaTotal": float(simulation.valor_parcela_total or 0),
                    "saldoTotal": float(simulation.saldo_total or 0),
                    "liberadoTotal": float(simulation.liberado_total or 0),
                    "seguroObrigatorio": float(simulation.seguro or 0),
                    "totalFinanciado": float(simulation.total_financiado or 0),
                    "valorLiquido": float(simulation.valor_liquido or 0),
                    "custoConsultoria": float(simulation.custo_consultoria or 0),
                    "liberadoCliente": float(simulation.liberado_cliente or 0),
                },
                "banks": enrich_banks_with_names(simulation.banks_json or []),
                "prazo": simulation.prazo,
                "percentualConsultoria": float(
                    simulation.percentual_consultoria or 0
                ),
                "results": simulation.results,
                "manual_input": simulation.manual_input,
                "created_at": simulation.created_at.isoformat()
                if simulation.created_at
                else None,
                "updated_at": simulation.updated_at.isoformat()
                if simulation.updated_at
                else None,
            }

        result["attachments"] = [
            {
                "id": a.id,
                "filename": os.path.basename(a.path),
                "size": a.size,
                "mime": a.mime,
                "mime_type": a.mime,
                "uploaded_at": a.created_at.isoformat() if a.created_at else None,
                "uploaded_by": a.uploaded_by,
            }
            for a in attachments
        ]

        contract = db.query(Contract).filter(Contract.case_id == case_id).first()
        if contract:
            contract_attachments = db.query(ContractAttachment).filter(
                ContractAttachment.contract_id == contract.id
            ).all()
            result["contract"] = {
                "id": contract.id,
                "status": contract.status,
                "total_amount": float(contract.total_amount or 0),
                "installments": contract.installments,
                "paid_installments": contract.paid_installments,
                "disbursed_at": contract.disbursed_at.isoformat() if contract.disbursed_at else None,
                "created_at": contract.created_at.isoformat() if contract.created_at else None,
                "updated_at": contract.updated_at.isoformat() if contract.updated_at else None,
                "attachments": [
                    {
                        "id": att.id,
                        "filename": att.filename,
                        "size": att.size,
                        "mime": att.mime,
                        "mime_type": att.mime,
                        "created_at": att.created_at.isoformat() if att.created_at else None,
                    }
                    for att in contract_attachments
                ],
            }

        return result


@r.post("/{case_id}/assign")
def assign_case(
    case_id: int,
    user=Depends(
        require_roles("admin", "supervisor", "financeiro", "calculista", "atendente")
    ),
):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        if (
            c.assigned_user_id
            and c.assignment_expires_at
            and c.assignment_expires_at > datetime.utcnow()
        ):
            raise HTTPException(400, "Caso já está atribuído a outro usuário")

        now = datetime.utcnow()
        c.assigned_user_id = user.id
        c.status = "em_atendimento"
        c.last_update_at = now
        c.assigned_at = now
        c.assignment_expires_at = now + timedelta(hours=72)

        if not c.assignment_history:
            c.assignment_history = []

        c.assignment_history.append(
            {
                "user_id": user.id,
                "user_name": user.name,
                "assigned_at": now.isoformat(),
                "expires_at": c.assignment_expires_at.isoformat(),
                "action": "assigned",
            }
        )

        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.assigned",
                payload={"to": user.id, "expires_at": c.assignment_expires_at.isoformat()},
                created_by=user.id,
            )
        )
        db.commit()
        return {"ok": True, "expires_at": c.assignment_expires_at.isoformat()}


@r.patch("/{case_id}/assignee")
def change_assignee(
    case_id: int, payload: AssigneeUpdate, user=Depends(require_roles("admin", "supervisor"))
):
    """Reatribui um caso a outro atendente (apenas admin/supervisor)."""
    from ..models import User

    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        new_user = db.get(User, payload.assignee_id)
        if not new_user:
            raise HTTPException(404, "Usuário não encontrado")
        if not new_user.active:
            raise HTTPException(400, "Usuário inativo")

        old_user_id = case.assigned_user_id
        old_user_name = case.assigned_user.name if case.assigned_user else None

        now = datetime.utcnow()
        case.assigned_user_id = new_user.id
        case.assigned_at = now
        case.assignment_expires_at = now + timedelta(hours=72)
        case.last_update_at = now

        if not case.assignment_history:
            case.assignment_history = []

        case.assignment_history.append(
            {
                "action": "reassigned",
                "from_user_id": old_user_id,
                "from_user_name": old_user_name,
                "to_user_id": new_user.id,
                "to_user_name": new_user.name,
                "timestamp": now.isoformat(),
                "changed_by": user.id,
                "changed_by_name": user.name,
                "expires_at": case.assignment_expires_at.isoformat(),
            }
        )

        db.add(
            CaseEvent(
                case_id=case.id,
                type="case.reassigned",
                payload={
                    "from": old_user_id,
                    "to": new_user.id,
                    "changed_by": user.id,
                    "expires_at": case.assignment_expires_at.isoformat(),
                },
                created_by=user.id,
            )
        )

        db.commit()

        return {
            "ok": True,
            "assigned_to": new_user.name,
            "assigned_to_id": new_user.id,
            "expires_at": case.assignment_expires_at.isoformat(),
        }


@r.patch("/{case_id}")
def patch_case(
    case_id: int, data: CasePatch, user=Depends(require_roles("admin", "supervisor", "atendente"))
):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        if data.telefone_preferencial is not None:
            c.client.telefone_preferencial = data.telefone_preferencial
        if data.numero_cliente is not None and hasattr(c.client, "numero_cliente"):
            c.client.numero_cliente = data.numero_cliente
        if data.observacoes is not None and hasattr(c.client, "observacoes"):
            c.client.observacoes = data.observacoes

        # Bancários
        if data.banco is not None:
            c.client.banco = data.banco
        if data.agencia is not None:
            c.client.agencia = data.agencia
        if data.conta is not None:
            c.client.conta = data.conta
        if data.chave_pix is not None:
            c.client.chave_pix = data.chave_pix
        if data.tipo_chave_pix is not None:
            c.client.tipo_chave_pix = data.tipo_chave_pix

        c.last_update_at = datetime.utcnow()
        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.updated",
                payload=data.model_dump(),
                created_by=user.id,
            )
        )
        db.commit()
        return {"ok": True}


@r.get("/{case_id}/attachments")
def list_attachments(case_id: int, user=Depends(get_current_user)):
    from ..models import Attachment

    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        attachments = db.query(Attachment).filter(Attachment.case_id == case_id).all()
        return {
            "items": [
                {
                    "id": a.id,
                    "filename": a.filename,
                    "size": a.size,
                    "mime": a.mime,
                    "uploaded_at": a.created_at.isoformat() if a.created_at else None,
                    "uploaded_by": a.uploaded_by,
                }
                for a in attachments
            ]
        }


@r.post("/{case_id}/attachments")
def upload_attachment(
    case_id: int,
    file: UploadFile = File(...),
    user=Depends(
        require_roles("admin", "supervisor", "financeiro", "calculista", "atendente")
    ),
):
    from ..models import Attachment

    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

    os.makedirs(settings.upload_dir, exist_ok=True)

    import uuid

    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"case_{case_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    dest = os.path.join(settings.upload_dir, unique_filename)

    try:
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, f"Erro ao salvar arquivo: {str(e)}")

    with SessionLocal() as db:
        a = Attachment(
            case_id=case_id,
            path=dest,
            filename=file.filename or "arquivo_sem_nome",
            mime=file.content_type,
            size=os.path.getsize(dest),
            uploaded_by=user.id,
        )
        db.add(a)
        db.add(
            CaseEvent(
                case_id=case_id,
                type="attachment.added",
                payload={"filename": file.filename, "size": a.size},
                created_by=user.id,
            )
        )
        db.commit()
        db.refresh(a)

        return {
            "id": a.id,
            "filename": file.filename,
            "size": a.size,
            "uploaded_at": a.created_at.isoformat() if a.created_at else None,
        }


@r.delete("/{case_id}/attachments/{attachment_id}")
def delete_attachment(
    case_id: int,
    attachment_id: int,
    user=Depends(
        require_roles("admin", "supervisor", "financeiro", "calculista", "atendente")
    ),
):
    """
    Remove um anexo de um caso.
    - Atendentes podem remover anexos que eles mesmos enviaram
    - Admin/Supervisor podem remover qualquer anexo
    """
    from ..models import Attachment

    with SessionLocal() as db:
        # Verificar se o caso existe
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Buscar o anexo
        attachment = db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.case_id == case_id
        ).first()

        if not attachment:
            raise HTTPException(404, "Anexo não encontrado")

        # Verificar permissões
        if user.role not in ["admin", "supervisor"]:
            # Atendentes só podem remover seus próprios anexos
            if attachment.uploaded_by != user.id:
                raise HTTPException(
                    403,
                    "Você só pode remover anexos que você mesmo enviou"
                )

        # Salvar informações antes de deletar
        filename = os.path.basename(attachment.path)
        file_path = attachment.path

        # Remover arquivo físico
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Erro ao remover arquivo físico {file_path}: {e}")
            # Continua mesmo se falhar ao remover o arquivo

        # Remover registro do banco
        db.delete(attachment)

        # Adicionar evento
        db.add(
            CaseEvent(
                case_id=case_id,
                type="attachment.deleted",
                payload={"filename": filename, "deleted_by": user.name},
                created_by=user.id,
            )
        )

        db.commit()

        return {"ok": True, "message": f"Anexo '{filename}' removido com sucesso"}


@r.get("/{case_id}/attachments/{attachment_id}/download")
def download_attachment(
    case_id: int,
    attachment_id: int,
    user=Depends(get_current_user)
):
    """
    Download de um anexo específico.
    Retorna o arquivo para visualização/download no navegador.
    """
    from fastapi.responses import FileResponse
    from ..models import Attachment

    with SessionLocal() as db:
        # Verificar se o caso existe
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Buscar o anexo
        attachment = db.query(Attachment).filter(
            Attachment.id == attachment_id,
            Attachment.case_id == case_id
        ).first()

        if not attachment:
            raise HTTPException(404, "Anexo não encontrado")

        # Verificar se o arquivo existe
        if not os.path.exists(attachment.path):
            raise HTTPException(404, "Arquivo não encontrado no servidor")

        # Retornar arquivo para download
        filename = os.path.basename(attachment.path)
        return FileResponse(
            path=attachment.path,
            filename=filename,
            media_type=attachment.mime or "application/octet-stream"
        )


@r.get("", response_model=PageOut)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: str | None = None,
    status: str | None = None,  # único ou CSV
    assigned: int | None = None,  # 0 = não atribuídos
    mine: bool = Query(False),  # True = meus casos
    order: str = Query("id_desc"),  # id_desc | id_asc | updated_desc
    created_after: str | None = None,  # ISO
    created_before: str | None = None,  # ISO
    user=Depends(
        require_roles("admin", "supervisor", "financeiro", "calculista", "atendente")
    ),
):
    with SessionLocal() as db:
        try:
            qry = db.query(Case)

            # RBAC
            if user.role == "atendente":
                if mine:
                    qry = qry.filter(Case.assigned_user_id == user.id)
                elif assigned == 0:
                    now = datetime.utcnow()
                    qry = qry.filter(
                        or_(
                            Case.assigned_user_id.is_(None),
                            Case.assignment_expires_at < now,
                        )
                    )
                else:
                    if assigned and assigned != user.id:
                        raise HTTPException(
                            403, "Você não tem permissão para ver casos de outros atendentes"
                        )
                    qry = qry.filter(Case.assigned_user_id == user.id)
            else:
                if mine:
                    qry = qry.filter(Case.assigned_user_id == user.id)
                elif assigned is not None:
                    if assigned == 0:
                        qry = qry.filter(Case.assigned_user_id.is_(None))
                    else:
                        qry = qry.filter(Case.assigned_user_id == assigned)

            # status (um ou CSV)
            if status:
                status_list = [s.strip() for s in status.split(",")]
                if len(status_list) == 1:
                    qry = qry.filter(Case.status == status_list[0])
                else:
                    qry = qry.filter(Case.status.in_(status_list))

            # datas
            if created_after:
                try:
                    date_after = datetime.fromisoformat(created_after.replace("Z", "+00:00"))
                    qry = qry.filter(Case.created_at >= date_after)
                except ValueError:
                    pass

            if created_before:
                try:
                    date_before = datetime.fromisoformat(created_before.replace("Z", "+00:00"))
                    qry = qry.filter(Case.created_at <= date_before)
                except ValueError:
                    pass

            # busca texto por cliente
            if q:
                qry = qry.join(Client, Client.id == Case.client_id)
                like = f"%{q}%"
                qry = qry.filter(or_(Client.name.ilike(like), Client.cpf.ilike(like)))

            total = qry.count()

            # ordenação
            if order == "id_asc":
                qry = qry.order_by(Case.id.asc())
            elif order == "updated_desc":
                qry = qry.order_by(Case.last_update_at.desc().nullslast(), Case.id.desc())
            elif order == "financiamentos_desc":
                # Para ordenação por financiamentos, vamos buscar todos e ordenar após
                pass
            else:
                qry = qry.order_by(Case.id.desc())

            # eager
            from sqlalchemy.orm import joinedload

            qry = qry.options(joinedload(Case.client), joinedload(Case.assigned_user))

            rows = qry.offset((page - 1) * page_size).limit(page_size).all()
            items = []

            for c in rows:
                try:
                    item = {
                        "id": c.id,
                        "status": c.status or "novo",
                        "client_id": c.client_id,
                        "assigned_user_id": c.assigned_user_id,
                        "assigned_to": c.assigned_user.name if c.assigned_user else None,
                        "last_update_at": c.last_update_at.isoformat()
                        if c.last_update_at
                        else None,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "banco": getattr(c, "banco", None),
                        "entidade": getattr(c, "entidade", None),
                        "referencia_competencia": getattr(
                            c, "referencia_competencia", None
                        ),
                        "importado_em": c.importado_em.isoformat()
                        if getattr(c, "importado_em", None)
                        else None,
                    }

                    if hasattr(c, "client") and c.client:
                        # Contar financiamentos do cliente
                        from app.models import PayrollLine
                        num_financiamentos = db.query(PayrollLine).filter(
                            PayrollLine.cpf == c.client.cpf
                        ).count()

                        item["client"] = {
                            "name": c.client.name or "Nome não informado",
                            "cpf": c.client.cpf or "",
                            "matricula": c.client.matricula or "",
                            "num_financiamentos": num_financiamentos,
                        }
                    else:
                        client = db.get(Client, c.client_id) if c.client_id else None
                        if client:
                            from app.models import PayrollLine
                            num_financiamentos = db.query(PayrollLine).filter(
                                PayrollLine.cpf == client.cpf
                            ).count()

                            item["client"] = {
                                "name": client.name or "Nome não informado",
                                "cpf": client.cpf or "",
                                "matricula": client.matricula or "",
                                "num_financiamentos": num_financiamentos,
                            }
                        else:
                            item["client"] = {
                                "name": "Cliente não encontrado",
                                "cpf": "",
                                "matricula": "",
                                "num_financiamentos": 0,
                            }

                    items.append(item)
                except Exception as e:
                    print(f"Erro ao processar caso {c.id}: {e}")
                    items.append(
                        {
                            "id": c.id,
                            "status": "erro",
                            "client_id": c.client_id,
                            "assigned_user_id": c.assigned_user_id,
                            "assigned_to": None,
                            "last_update_at": None,
                            "created_at": None,
                            "banco": None,
                            "client": {
                                "name": "Erro ao carregar",
                                "cpf": "",
                                "matricula": "",
                            },
                        }
                    )

            # Ordenar por número de financiamentos se necessário
            if order == "financiamentos_desc":
                items.sort(key=lambda x: x.get("client", {}).get("num_financiamentos", 0), reverse=True)

            return {"items": items, "total": total, "page": page, "page_size": page_size}

        except Exception as e:
            print(f"Erro na query de casos: {e}")
            return {
                "items": [],
                "total": 0,
                "page": page,
                "page_size": page_size,
                "error": str(e),
            }


@r.post("/{case_id}/release")
def release_case(
    case_id: int,
    user=Depends(
        require_roles("admin", "supervisor", "financeiro", "calculista", "atendente")
    ),
):
    """Libera um caso antes do prazo (lock) de 72 horas."""
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        if c.assigned_user_id != user.id and user.role not in ["admin", "supervisor"]:
            raise HTTPException(403, "Você só pode liberar casos atribuídos a você")

        if not c.assignment_history:
            c.assignment_history = []

        c.assignment_history.append(
            {
                "user_id": user.id,
                "user_name": user.name,
                "released_at": datetime.utcnow().isoformat(),
                "action": "released",
            }
        )

        c.assigned_user_id = None
        c.status = "disponivel"
        c.assigned_at = None
        c.assignment_expires_at = None
        c.last_update_at = datetime.utcnow()

        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.released",
                payload={"by": user.id},
                created_by=user.id,
            )
        )
        db.commit()
        return {"ok": True}


@r.post("/{case_id}/check-expiry")
def check_case_expiry(case_id: int, user=Depends(require_roles("admin", "supervisor"))):
    """Verifica se um caso expirou e libera se necessário."""
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        now = datetime.utcnow()
        is_expired = c.assignment_expires_at and c.assignment_expires_at <= now

        if is_expired and c.assigned_user_id:
            if not c.assignment_history:
                c.assignment_history = []

            c.assignment_history.append(
                {
                    "user_id": c.assigned_user_id,
                    "expired_at": now.isoformat(),
                    "action": "expired",
                }
            )

            c.assigned_user_id = None
            c.status = "disponivel"
            c.assigned_at = None
            c.assignment_expires_at = None
            c.last_update_at = now

            db.add(
                CaseEvent(
                    case_id=c.id,
                    type="case.expired",
                    payload={"expired_at": now.isoformat()},
                    created_by=user.id,
                )
            )
            db.commit()

        return {
            "case_id": case_id,
            "is_expired": is_expired,
            "assignment_expires_at": c.assignment_expires_at.isoformat()
            if c.assignment_expires_at
            else None,
            "was_released": is_expired and c.assigned_user_id is None,
        }


@r.patch("/{case_id}/expiry")
def update_case_expiry(
    case_id: int,
    payload: ExpiryUpdate,
    user=Depends(require_roles("admin", "supervisor")),
):
    """Ajusta manualmente `assignment_expires_at` para facilitar testes de SLA.

    - Se `force_expired` for True, define expiração para o passado (agora - 1s).
    - Se `expires_at_iso` for fornecido, usa essa data/hora em UTC.
    - Mantém demais campos e não libera automaticamente; use `/check-expiry` ou scheduler.
    """
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Caso não encontrado")

        now = datetime.utcnow()
        new_expiry = None

        if payload.force_expired:
            new_expiry = now - timedelta(seconds=1)
        elif payload.expires_at_iso:
            # Aceita formato "Z" e sem "Z"
            try:
                iso = payload.expires_at_iso.replace("Z", "+00:00") if payload.expires_at_iso.endswith("Z") else payload.expires_at_iso
                dt = datetime.fromisoformat(iso)
                # Normaliza para naive UTC se vier com tzinfo
                new_expiry = dt.astimezone(tz=None).replace(tzinfo=None) if dt.tzinfo else dt
            except Exception:
                raise HTTPException(400, "Formato inválido para expires_at_iso")
        else:
            raise HTTPException(400, "Informe force_expired ou expires_at_iso")

        c.assignment_expires_at = new_expiry
        c.last_update_at = now

        if not c.assignment_history:
            c.assignment_history = []
        c.assignment_history.append(
            {
                "user_id": user.id,
                "user_name": user.name,
                "updated_at": now.isoformat(),
                "action": "expiry_adjusted",
                "new_expiry": new_expiry.isoformat() if new_expiry else None,
            }
        )

        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.expiry_adjusted",
                payload={"new_expiry": new_expiry.isoformat()},
                created_by=user.id,
            )
        )
        db.commit()

    # Não muda status automaticamente; permite acionar manualmente o check
    return {
        "case_id": case_id,
        "assignment_expires_at": new_expiry.isoformat() if new_expiry else None,
        "status": "unchanged",
        "note": "Use /cases/{id}/check-expiry ou scheduler para processar expiração",
    }


@r.post("/{case_id}/to-calculista")
async def to_calculista(case_id: int, user=Depends(require_roles("admin", "supervisor", "atendente"))):
    from ..models import Simulation, User
    from .notifications import create_notification_for_user

    sim_id = None
    calculista_ids = []
    client_name = "Cliente"

    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        # Salvar dados antes de fechar a sessão
        client_name = c.client.name if c.client else "Cliente"

        sim = Simulation(case_id=c.id, status="draft", created_by=user.id)
        db.add(sim)
        c.status = "calculista_pendente"
        c.last_update_at = datetime.utcnow()

        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.to_calculista",
                payload={"simulation_id": None},
                created_by=user.id,
            )
        )
        db.commit()
        db.refresh(sim)
        sim_id = sim.id

        # Buscar todos os calculistas para notificar
        calculistas = db.query(User).filter(
            User.role == "calculista",
            User.active
        ).all()
        calculista_ids = [calc.id for calc in calculistas]

    # Enviar notificações para os calculistas (agora fora da sessão, mas com dados já carregados)
    for calc_id in calculista_ids:
        await create_notification_for_user(
            user_id=calc_id,
            event="case.to_calculista",
            payload={
                "case_id": case_id,
                "message": f"📊 Novo caso enviado por {user.name}",
                "client_name": client_name,
                "simulation_id": sim_id
            }
        )

    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "calculista_pendente"})
    return {"simulation_id": sim_id}


@r.post("/{case_id}/mark-no-contact")
async def mark_no_contact(case_id: int, user=Depends(require_roles("admin", "supervisor", "atendente"))):
    """Marca uma tentativa de contato sem sucesso no caso."""
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        # Mudar status do caso para "sem_contato"
        c.status = "sem_contato"

        # Adicionar evento de histórico
        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.no_contact",
                payload={
                    "message": "Tentativa de contato sem sucesso",
                    "user": user.name,
                    "status_changed_to": "sem_contato"
                },
                created_by=user.id,
            )
        )

        # Atualizar observações do cliente
        current_obs = c.client.observacoes or ""
        timestamp = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
        new_obs = f"{current_obs}\n[{timestamp}] Sem contato - {user.name}".strip()
        c.client.observacoes = new_obs

        c.last_update_at = datetime.utcnow()
        db.commit()

    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "sem_contato"})
    return {"success": True, "case_id": case_id, "status": "sem_contato"}


@r.post("/{case_id}/to-fechamento")
async def to_fechamento(case_id: int, user=Depends(require_roles("admin", "supervisor", "atendente"))):
    """Envia um caso com cálculo aprovado para a fila de fechamento."""
    from ..models import User
    from .notifications import create_notification_for_user

    client_name = "Cliente"
    fechamento_user_ids = []

    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        # Verificar se o status é "calculo_aprovado"
        if c.status != "calculo_aprovado":
            raise HTTPException(400, "Apenas casos com cálculo aprovado podem ser enviados para fechamento")

        # Salvar nome do cliente antes de fechar a sessão
        client_name = c.client.name if c.client else "Cliente"

        # Atualizar status do caso
        c.status = "fechamento_pendente"
        c.last_update_at = datetime.utcnow()

        # Adicionar evento de histórico
        db.add(
            CaseEvent(
                case_id=c.id,
                type="case.to_fechamento",
                payload={
                    "sent_by": user.name,
                    "sent_at": datetime.utcnow().isoformat()
                },
                created_by=user.id,
            )
        )
        db.commit()

        # Buscar todos os usuários do módulo fechamento para notificar
        fechamento_users = db.query(User).filter(
            User.role.in_(["fechamento", "admin", "supervisor"]),
            User.active
        ).all()
        fechamento_user_ids = [u.id for u in fechamento_users]

    # Enviar notificações (fora da sessão)
    for user_id in fechamento_user_ids:
        await create_notification_for_user(
            user_id=user_id,
            event="case.to_fechamento",
            payload={
                "case_id": case_id,
                "message": f"📋 Novo caso enviado para fechamento por {user.name}",
                "client_name": client_name
            }
        )

    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "fechamento_pendente"})
    return {"success": True, "case_id": case_id, "status": "fechamento_pendente"}


@r.post("/scheduler/run-maintenance")
def run_scheduler_maintenance(user=Depends(require_roles("admin", "supervisor"))):
    """Executa manualmente a manutenção do scheduler."""
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        stats = scheduler.process_expired_cases()
        return {
            "maintenance_completed": True,
            "stats": stats,
            "executed_at": datetime.utcnow().isoformat(),
            "executed_by": user.id,
        }


@r.get("/scheduler/statistics")
def get_scheduler_statistics(days: int = 7, user=Depends(require_roles("admin", "supervisor"))):
    """Retorna estatísticas do scheduler dos últimos N dias."""
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        stats = scheduler.get_assignment_statistics(days)
        near_expiry = scheduler.get_cases_near_expiry(hours_before=2)
        return {
            "statistics": stats,
            "cases_near_expiry": near_expiry,
            "near_expiry_count": len(near_expiry),
        }


@r.get("/scheduler/cases-near-expiry")
def get_cases_near_expiry(hours_before: int = 2, user=Depends(require_roles("admin", "supervisor"))):
    """Lista casos próximos de expirar."""
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        cases = scheduler.get_cases_near_expiry(hours_before)
        return {"cases": cases, "count": len(cases), "hours_before_expiry": hours_before}


@r.post("/bulk-delete")
async def bulk_delete_cases(payload: BulkDeleteRequest, user=Depends(require_roles("admin"))):
    """Exclusão em lote de casos (apenas admin)."""
    from ..models import Simulation, Attachment

    if not payload.ids:
        raise HTTPException(400, "Lista de IDs vazia")
    if len(payload.ids) > 100:
        raise HTTPException(400, "Máximo de 100 casos por vez")

    with SessionLocal() as db:
        results = {"deleted": [], "failed": [], "total_requested": len(payload.ids)}

        for case_id in payload.ids:
            try:
                case = db.get(Case, case_id)
                if not case:
                    results["failed"].append({"id": case_id, "reason": "Caso não encontrado"})
                    continue

                # simulações
                simulations = db.query(Simulation).filter(Simulation.case_id == case_id).all()
                for sim in simulations:
                    db.delete(sim)

                # anexos
                attachments = db.query(Attachment).filter(Attachment.case_id == case_id).all()
                for att in attachments:
                    try:
                        if os.path.exists(att.path):
                            os.remove(att.path)
                    except Exception as e:
                        print(f"Erro ao excluir arquivo {att.path}: {e}")
                    db.delete(att)

                # eventos
                events = db.query(CaseEvent).filter(CaseEvent.case_id == case_id).all()
                for event in events:
                    db.delete(event)

                # caso
                db.delete(case)
                results["deleted"].append(case_id)

            except Exception as e:
                results["failed"].append({"id": case_id, "reason": str(e)})
                print(f"Erro ao excluir caso {case_id}: {e}")

        db.commit()

    await eventbus.broadcast(
        "cases.bulk_deleted",
        {"deleted_ids": results["deleted"], "count": len(results["deleted"]), "deleted_by": user.id},
    )

    return {**results, "success_count": len(results["deleted"]), "failed_count": len(results["failed"])}


@r.get("/{case_id}/events")
def get_case_events(case_id: int, user=Depends(get_current_user)):
    """Retorna o histórico de eventos de um caso específico."""
    from ..models import User

    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        events = (
            db.query(CaseEvent)
            .filter(CaseEvent.case_id == case_id)
            .order_by(CaseEvent.created_at.desc())
            .all()
        )

        user_ids = {e.created_by for e in events if e.created_by}
        users = (
            {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()}
            if user_ids
            else {}
        )

        formatted_events = []
        for e in events:
            created_by_user = users.get(e.created_by) if e.created_by else None
            formatted_events.append(
                {
                    "id": e.id,
                    "type": e.type,
                    "payload": e.payload or {},
                    "created_at": e.created_at.isoformat() if e.created_at else None,
                    "created_by": {
                        "id": created_by_user.id,
                        "name": created_by_user.name,
                        "role": created_by_user.role,
                    }
                    if created_by_user
                    else None,
                }
            )

        return {"case_id": case_id, "events": formatted_events, "total": len(formatted_events)}


class CreateEventRequest(BaseModel):
    type: str
    payload: dict = {}


@r.post("/{case_id}/events")
async def create_case_event(
    case_id: int,
    data: CreateEventRequest,
    user=Depends(get_current_user)
):
    """Cria um novo evento/anotação em um caso."""
    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        # Criar o evento
        event = CaseEvent(
            case_id=case_id,
            type=data.type,
            payload=data.payload,
            created_by=user.id
        )
        db.add(event)

        # Atualizar timestamp do caso
        case.last_update_at = datetime.utcnow()

        db.commit()
        db.refresh(event)

        # Broadcast via WebSocket
        await eventbus.broadcast("case.updated", {
            "case_id": case_id,
            "event_type": data.type,
            "user_id": user.id
        })

        return {
            "id": event.id,
            "type": event.type,
            "payload": event.payload,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "created_by": {
                "id": user.id,
                "name": user.name,
                "role": user.role
            }
        }


@r.post("/{case_id}/return-to-calculista")
async def return_to_calculista(
    case_id: int, user=Depends(require_roles("admin", "supervisor", "financeiro"))
):
    """Retorna um caso para o calculista (refazer simulação)."""
    with SessionLocal() as db:
        case = db.get(Case, case_id)
        if not case:
            raise HTTPException(404, "Caso não encontrado")

        previous_status = case.status
        case.status = "devolvido_financeiro"
        case.last_update_at = datetime.utcnow()

        db.add(
            CaseEvent(
                case_id=case.id,
                type="case.return_to_calculista",
                payload={
                    "returned_by": user.id,
                    "returned_by_name": user.name,
                    "previous_status": previous_status,
                    "reason": "Devolvido do financeiro para recálculo"
                },
                created_by=user.id,
            )
        )
        db.commit()

    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "devolvido_financeiro"})
    return {"success": True, "message": "Caso retornado ao calculista com sucesso"}
