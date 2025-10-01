from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
# (removed unused import)
from pydantic import BaseModel
from ..rbac import require_roles
from ..security import get_current_user
from ..db import SessionLocal
from ..models import Case, Client, CaseEvent
from ..services.case_scheduler import CaseScheduler
from datetime import datetime, timedelta
from ..config import settings
import os
import shutil

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

@r.get("/{case_id}")
def get_case(case_id:int, user=Depends(get_current_user)):
    from ..models import Simulation, Attachment
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        # Buscar simulação mais recente do caso
        simulation = db.query(Simulation).filter(
            Simulation.case_id == case_id
        ).order_by(Simulation.id.desc()).first()

        # Buscar anexos do caso
        attachments = db.query(Attachment).filter(
            Attachment.case_id == case_id
        ).all()

        # Buscar financiamentos do cliente
        from app.models import PayrollLine
        financiamentos = db.query(PayrollLine).filter(
            PayrollLine.cpf == c.client.cpf,
            PayrollLine.matricula == c.client.matricula
        ).order_by(
            PayrollLine.ref_year.desc(),
            PayrollLine.ref_month.desc(),
            PayrollLine.entity_code.asc()
        ).all()

        result = {
            "id": c.id,
            "status": c.status,
            "created_at": c.last_update_at.isoformat() if c.last_update_at else None,
            "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
            "assigned_to": c.assigned_user.name if c.assigned_user else None,
            "entidade": getattr(c, 'entidade', None),
            "referencia_competencia": getattr(c, 'referencia_competencia', None),
            "importado_em": c.importado_em.isoformat() if getattr(c, 'importado_em', None) else None,
            "client": {
                "id": c.client.id,
                "name": c.client.name,
                "cpf": c.client.cpf,
                "matricula": c.client.matricula,
                "orgao": getattr(c.client, 'orgao', None),
                "telefone_preferencial": getattr(c.client, 'telefone_preferencial', None),
                "numero_cliente": getattr(c.client, 'numero_cliente', None),
                "observacoes": getattr(c.client, 'observacoes', None),

                # Dados bancários
                "banco": getattr(c.client, 'banco', None),
                "agencia": getattr(c.client, 'agencia', None),
                "conta": getattr(c.client, 'conta', None),
                "chave_pix": getattr(c.client, 'chave_pix', None),
                "tipo_chave_pix": getattr(c.client, 'tipo_chave_pix', None),

                # Dados de financiamentos do módulo cliente
                "financiamentos": [
                    {
                        "id": line.id,
                        "financiamento_code": line.financiamento_code,
                        "total_parcelas": line.total_parcelas,
                        "parcelas_pagas": line.parcelas_pagas,
                        "valor_parcela_ref": str(line.valor_parcela_ref) if line.valor_parcela_ref else "0.00",
                        "orgao_pagamento": line.orgao_pagamento,
                        "orgao_pagamento_nome": line.orgao_pagamento_nome,
                        "entity_name": line.entity_name,
                        "status_code": line.status_code,
                        "status_description": line.status_description,
                        "referencia": f"{line.ref_month:02d}/{line.ref_year}",
                        "entity_code": line.entity_code,
                        "cargo": line.cargo,
                        "orgao": line.orgao,
                        "lanc": line.lanc
                    } for line in financiamentos
                ]
            }
        }

        # Incluir dados da simulação se existe
        if simulation:
            result["simulation"] = {
                "id": simulation.id,
                "status": simulation.status,
                # Totais calculados (formato novo)
                "totals": {
                    "valorParcelaTotal": float(simulation.valor_parcela_total or 0),
                    "saldoTotal": float(simulation.saldo_total or 0),
                    "liberadoTotal": float(simulation.liberado_total or 0),
                    "seguroObrigatorio": float(simulation.seguro or 0),  # NOVO
                    "totalFinanciado": float(simulation.total_financiado or 0),
                    "valorLiquido": float(simulation.valor_liquido or 0),
                    "custoConsultoria": float(simulation.custo_consultoria or 0),
                    "liberadoCliente": float(simulation.liberado_cliente or 0)
                },
                # Dados dos bancos
                "banks": simulation.banks_json,
                "prazo": simulation.prazo,
                "percentualConsultoria": float(simulation.percentual_consultoria or 0),
                # Manter campos legados por compatibilidade
                "results": simulation.results,
                "manual_input": simulation.manual_input,
                "created_at": simulation.created_at.isoformat() if simulation.created_at else None,
                "updated_at": simulation.updated_at.isoformat() if simulation.updated_at else None
            }

        # Incluir anexos
        result["attachments"] = [
            {
                "id": a.id,
                "filename": os.path.basename(a.path),
                "size": a.size,
                "mime": a.mime,
                "uploaded_at": a.created_at.isoformat() if a.created_at else None,
                "uploaded_by": a.uploaded_by
            } for a in attachments
        ]

        return result

@r.post("/{case_id}/assign")
def assign_case(case_id:int, user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        # Verificar se o caso já está atribuído e não expirou
        if c.assigned_user_id and c.assignment_expires_at and c.assignment_expires_at > datetime.utcnow():
            raise HTTPException(400, "Caso já está atribuído a outro usuário")

        # Configurar atribuição com lock de 72 horas
        now = datetime.utcnow()
        c.assigned_user_id = user.id
        c.status = "em_atendimento"
        c.last_update_at = now
        c.assigned_at = now
        c.assignment_expires_at = now + timedelta(hours=72)

        # Adicionar ao histórico de atribuições
        if not c.assignment_history:
            c.assignment_history = []

        c.assignment_history.append({
            "user_id": user.id,
            "user_name": user.name,
            "assigned_at": now.isoformat(),
            "expires_at": c.assignment_expires_at.isoformat(),
            "action": "assigned"
        })

        db.add(CaseEvent(case_id=c.id, type="case.assigned", payload={
            "to": user.id,
            "expires_at": c.assignment_expires_at.isoformat()
        }, created_by=user.id))
        db.commit()
        return {"ok": True, "expires_at": c.assignment_expires_at.isoformat()}

@r.patch("/{case_id}")
def patch_case(case_id:int, data: CasePatch, user=Depends(require_roles("admin","supervisor","atendente"))):
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        if data.telefone_preferencial is not None:
            c.client.telefone_preferencial = data.telefone_preferencial
        if data.numero_cliente is not None:
            if hasattr(c.client, 'numero_cliente'):
                c.client.numero_cliente = data.numero_cliente
        if data.observacoes is not None:
            if hasattr(c.client, 'observacoes'):
                c.client.observacoes = data.observacoes

        # Atualizar dados bancários
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
        db.add(CaseEvent(case_id=c.id, type="case.updated", payload=data.model_dump(), created_by=user.id))
        db.commit()
        return {"ok": True}

@r.get("/{case_id}/attachments")
def list_attachments(case_id:int, user=Depends(get_current_user)):
    from ..models import Attachment
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

        attachments = db.query(Attachment).filter(Attachment.case_id == case_id).all()
        return {"items": [
            {
                "id": a.id,
                "filename": os.path.basename(a.path),
                "size": a.size,
                "mime": a.mime,
                "uploaded_at": a.created_at.isoformat() if a.created_at else None,
                "uploaded_by": a.uploaded_by
            } for a in attachments
        ]}

@r.post("/{case_id}/attachments")
def upload_attachment(case_id:int, file: UploadFile = File(...), user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente"))):
    from ..models import Attachment

    # Verificar se o caso existe
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404, "Case not found")

    # Criar diretório de upload
    os.makedirs(settings.upload_dir, exist_ok=True)

    # Gerar nome único para o arquivo
    import uuid
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"case_{case_id}_{uuid.uuid4().hex[:8]}{file_extension}"
    dest = os.path.join(settings.upload_dir, unique_filename)

    # Salvar arquivo
    try:
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(500, f"Erro ao salvar arquivo: {str(e)}")

    # Persistir no banco
    with SessionLocal() as db:
        a = Attachment(
            case_id=case_id,
            path=dest,
            mime=file.content_type,
            size=os.path.getsize(dest),
            uploaded_by=user.id
        )
        db.add(a)
        db.add(CaseEvent(
            case_id=case_id,
            type="attachment.added",
            payload={"filename": file.filename, "size": a.size},
            created_by=user.id
        ))
        db.commit()
        db.refresh(a)

        return {
            "id": a.id,
            "filename": file.filename,
            "size": a.size,
            "uploaded_at": a.created_at.isoformat() if a.created_at else None
        }
@r.get("", response_model=PageOut)
def list_cases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: str | None = None,
    status: str | None = None,          # Pode ser único ou CSV: "novo,em_atendimento"
    assigned: int | None = None,        # 0 = não atribuídos
    mine: bool = Query(False),          # True = meus casos atribuídos
    order: str = Query("id_desc"),       # id_desc | id_asc | updated_desc
    created_after: str | None = None,   # ISO date string: 2025-01-01
    created_before: str | None = None,  # ISO date string: 2025-12-31
    user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente")),
):
    with SessionLocal() as db:
        try:
            # Query mais simples para debug
            qry = db.query(Case)

            # RBAC: Atendentes só veem seus casos ou casos disponíveis
            if user.role == "atendente":
                if mine:
                    # Atendente vê apenas seus próprios casos
                    qry = qry.filter(Case.assigned_user_id == user.id)
                elif assigned == 0:
                    # Atendente vê apenas casos não atribuídos (ou casos expirados)
                    from sqlalchemy import or_
                    now = datetime.utcnow()
                    qry = qry.filter(
                        or_(
                            Case.assigned_user_id.is_(None),
                            Case.assignment_expires_at < now  # Lock expirado
                        )
                    )
                else:
                    # Atendente NÃO pode ver casos de outros atendentes
                    if assigned and assigned != user.id:
                        raise HTTPException(403, "Você não tem permissão para ver casos de outros atendentes")
                    qry = qry.filter(Case.assigned_user_id == user.id)
            else:
                # Admin, supervisor, calculista, financeiro podem ver TODOS os casos
                # Importante: se nenhum filtro for aplicado, admin vê TUDO (incluindo atribuídos)
                if mine:
                    # Apenas casos do próprio usuário
                    qry = qry.filter(Case.assigned_user_id == user.id)
                elif assigned is not None:
                    # Filtro específico de atribuição
                    if assigned == 0:
                        qry = qry.filter(Case.assigned_user_id.is_(None))
                    else:
                        qry = qry.filter(Case.assigned_user_id == assigned)
                # Se nem mine nem assigned foram especificados, não filtrar nada
                # Admin/supervisor/calculista/financeiro vêem TODOS os casos por padrão

            # Filtros adicionais

            # Filtro de status: aceita único ou múltiplos separados por vírgula
            if status:
                status_list = [s.strip() for s in status.split(",")]
                if len(status_list) == 1:
                    qry = qry.filter(Case.status == status_list[0])
                else:
                    qry = qry.filter(Case.status.in_(status_list))

            # Filtros de data
            if created_after:
                try:
                    date_after = datetime.fromisoformat(created_after.replace("Z", "+00:00"))
                    qry = qry.filter(Case.created_at >= date_after)
                except ValueError:
                    pass  # Ignorar data inválida

            if created_before:
                try:
                    date_before = datetime.fromisoformat(created_before.replace("Z", "+00:00"))
                    qry = qry.filter(Case.created_at <= date_before)
                except ValueError:
                    pass  # Ignorar data inválida

            # Busca por texto (nome ou CPF do cliente)
            if q:
                qry = qry.join(Client, Client.id == Case.client_id)
                like = f"%{q}%"
                qry = qry.filter(or_(Client.name.ilike(like), Client.cpf.ilike(like)))

            total = qry.count()

            # Aplicar ordenação
            if order == "id_asc":
                qry = qry.order_by(Case.id.asc())
            elif order == "updated_desc":
                qry = qry.order_by(Case.last_update_at.desc().nullslast(), Case.id.desc())
            else:
                qry = qry.order_by(Case.id.desc())

            # Eager loading para relacionamentos
            from sqlalchemy.orm import joinedload
            qry = qry.options(joinedload(Case.client), joinedload(Case.assigned_user))

            rows = qry.offset((page-1)*page_size).limit(page_size).all()
            items = []

            for c in rows:
                try:
                    item = {
                        "id": c.id,
                        "status": c.status or "novo",
                        "client_id": c.client_id,
                        "assigned_user_id": c.assigned_user_id,
                        "assigned_to": c.assigned_user.name if c.assigned_user else None,
                        "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "banco": getattr(c, 'banco', None),
                        "entidade": getattr(c, 'entidade', None),
                        "referencia_competencia": getattr(c, 'referencia_competencia', None),
                        "importado_em": c.importado_em.isoformat() if getattr(c, 'importado_em', None) else None,
                    }

                    # Client info - verificar se existe
                    if hasattr(c, 'client') and c.client:
                        item["client"] = {
                            "name": c.client.name or "Nome não informado",
                            "cpf": c.client.cpf or "",
                            "matricula": c.client.matricula or ""
                        }
                    else:
                        # Se não tem client, vamos buscar separadamente
                        client = db.get(Client, c.client_id) if c.client_id else None
                        if client:
                            item["client"] = {
                                "name": client.name or "Nome não informado",
                                "cpf": client.cpf or "",
                                "matricula": client.matricula or ""
                            }
                        else:
                            item["client"] = {
                                "name": "Cliente não encontrado",
                                "cpf": "",
                                "matricula": ""
                            }

                    items.append(item)
                except Exception as e:
                    print(f"Erro ao processar caso {c.id}: {e}")
                    # Adicionar item mínimo para não perder o caso
                    items.append({
                        "id": c.id,
                        "status": "erro",
                        "client_id": c.client_id,
                        "assigned_user_id": c.assigned_user_id,
                        "assigned_to": None,
                        "last_update_at": None,
                        "created_at": None,
                        "banco": None,
                        "client": {"name": "Erro ao carregar", "cpf": "", "matricula": ""}
                    })

            return {"items": items, "total": total, "page": page, "page_size": page_size}

        except Exception as e:
            print(f"Erro na query de casos: {e}")
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "error": str(e)}

@r.post("/{case_id}/release")
def release_case(case_id:int, user=Depends(require_roles("admin","supervisor","financeiro","calculista","atendente"))):
    """
    Libera um caso antes do prazo de 72 horas.
    Permite que outros usuários peguem o caso imediatamente.
    """
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        # Verificar se o usuário pode liberar o caso
        if c.assigned_user_id != user.id and user.role not in ["admin", "supervisor"]:
            raise HTTPException(403, "Você só pode liberar casos atribuídos a você")

        # Adicionar ao histórico antes de liberar
        if not c.assignment_history:
            c.assignment_history = []

        c.assignment_history.append({
            "user_id": user.id,
            "user_name": user.name,
            "released_at": datetime.utcnow().isoformat(),
            "action": "released"
        })

        # Liberar caso
        c.assigned_user_id = None
        c.status = "disponivel"
        c.assigned_at = None
        c.assignment_expires_at = None
        c.last_update_at = datetime.utcnow()

        db.add(CaseEvent(case_id=c.id, type="case.released", payload={"by": user.id}, created_by=user.id))
        db.commit()
        return {"ok": True}

@r.post("/{case_id}/check-expiry")
def check_case_expiry(case_id:int, user=Depends(require_roles("admin","supervisor"))):
    """
    Verifica se um caso expirou e força a liberação se necessário.
    Endpoint administrativo para verificação manual.
    """
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)

        now = datetime.utcnow()
        is_expired = c.assignment_expires_at and c.assignment_expires_at <= now

        if is_expired and c.assigned_user_id:
            # Forçar liberação
            if not c.assignment_history:
                c.assignment_history = []

            c.assignment_history.append({
                "user_id": c.assigned_user_id,
                "expired_at": now.isoformat(),
                "action": "expired"
            })

            c.assigned_user_id = None
            c.status = "disponivel"
            c.assigned_at = None
            c.assignment_expires_at = None
            c.last_update_at = now

            db.add(CaseEvent(case_id=c.id, type="case.expired", payload={"expired_at": now.isoformat()}, created_by=user.id))
            db.commit()

        return {
            "case_id": case_id,
            "is_expired": is_expired,
            "assignment_expires_at": c.assignment_expires_at.isoformat() if c.assignment_expires_at else None,
            "was_released": is_expired and c.assigned_user_id is None
        }

@r.post("/{case_id}/to-calculista")
async def to_calculista(case_id:int, user=Depends(require_roles("admin","supervisor","atendente"))):
    from ..models import Simulation, CaseEvent
    from ..events import eventbus
    with SessionLocal() as db:
        c = db.get(Case, case_id)
        if not c:
            raise HTTPException(404)
        sim = Simulation(case_id=c.id, status="draft", created_by=user.id)
        db.add(sim)
        c.status = "calculista_pendente"
        c.last_update_at = datetime.utcnow()

        # Manter atendente vinculado para acompanhamento
        # NÃO limpar assigned_user_id, assigned_at, assignment_expires_at
        # Atendente continuará vendo o caso em "Meus Atendimentos" com status atualizado

        db.add(CaseEvent(case_id=c.id, type="case.to_calculista", payload={"simulation_id": None}, created_by=user.id))
        db.commit()
        db.refresh(sim)
    await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "calculista_pendente"})
    return {"simulation_id": sim.id}

@r.post("/scheduler/run-maintenance")
def run_scheduler_maintenance(user=Depends(require_roles("admin","supervisor"))):
    """
    Executa manualmente a manutenção do scheduler.
    Processa casos expirados e retorna estatísticas.
    """
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        stats = scheduler.process_expired_cases()
        return {
            "maintenance_completed": True,
            "stats": stats,
            "executed_at": datetime.utcnow().isoformat(),
            "executed_by": user.id
        }

@r.get("/scheduler/statistics")
def get_scheduler_statistics(
    days: int = 7,
    user=Depends(require_roles("admin","supervisor"))
):
    """
    Retorna estatísticas do scheduler dos últimos N dias.
    """
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        stats = scheduler.get_assignment_statistics(days)

        # Adicionar casos próximos do vencimento
        near_expiry = scheduler.get_cases_near_expiry(hours_before=2)

        return {
            "statistics": stats,
            "cases_near_expiry": near_expiry,
            "near_expiry_count": len(near_expiry)
        }

@r.get("/scheduler/cases-near-expiry")
def get_cases_near_expiry(
    hours_before: int = 2,
    user=Depends(require_roles("admin","supervisor"))
):
    """
    Lista casos que estão próximos de expirar.
    Útil para notificações e alertas.
    """
    with SessionLocal() as db:
        scheduler = CaseScheduler(db)
        cases = scheduler.get_cases_near_expiry(hours_before)
        return {
            "cases": cases,
            "count": len(cases),
            "hours_before_expiry": hours_before
        }
