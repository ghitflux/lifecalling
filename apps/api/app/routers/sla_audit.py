"""
Router para auditoria de SLA de 48h úteis.

Fornece endpoints para visualizar histórico de execuções do scheduler,
estatísticas e exportação em CSV.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional
from datetime import datetime
import csv
import io

from ..rbac import require_roles
from ..security import get_current_user
from ..db import get_db
from ..models import SLAExecution, User, now_brt

r = APIRouter(prefix="/sla-audit", tags=["sla-audit"])


@r.get("/executions")
def get_executions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    execution_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """
    Lista execuções do scheduler de SLA com paginação.

    Args:
        page: Número da página (inicia em 1)
        limit: Itens por página (padrão 20, máximo 100)
        from_: Data inicial (ISO 8601)
        to: Data final (ISO 8601)
        execution_type: Filtrar por tipo ('scheduled' ou 'manual')

    Returns:
        {
            "data": [...],
            "total": int,
            "page": int,
            "limit": int,
            "total_pages": int
        }
    """
    # Query base
    query = db.query(SLAExecution)

    # Filtros
    filters = []

    if from_:
        try:
            from_date = datetime.fromisoformat(from_)
            filters.append(SLAExecution.executed_at >= from_date)
        except ValueError:
            raise HTTPException(400, "Data 'from' inválida. Use formato ISO 8601.")

    if to:
        try:
            to_date = datetime.fromisoformat(to)
            filters.append(SLAExecution.executed_at <= to_date)
        except ValueError:
            raise HTTPException(400, "Data 'to' inválida. Use formato ISO 8601.")

    if execution_type:
        if execution_type not in ["scheduled", "manual"]:
            raise HTTPException(400, "execution_type deve ser 'scheduled' ou 'manual'")
        filters.append(SLAExecution.execution_type == execution_type)

    if filters:
        query = query.filter(and_(*filters))

    # Total de registros
    total = query.count()

    # Paginação
    offset = (page - 1) * limit
    executions = query.order_by(SLAExecution.executed_at.desc()).offset(offset).limit(limit).all()

    # Formatar dados
    data = []
    for execution in executions:
        executed_by_name = None
        if execution.executed_by_user_id:
            executed_by = db.query(User).get(execution.executed_by_user_id)
            executed_by_name = executed_by.name if executed_by else "Usuário removido"

        data.append({
            "id": execution.id,
            "executed_at": execution.executed_at.isoformat(),
            "execution_type": execution.execution_type,
            "cases_expired_count": execution.cases_expired_count,
            "cases_released_count": len(execution.cases_released or []),
            "duration_seconds": float(execution.duration_seconds) if execution.duration_seconds else None,
            "executed_by": executed_by_name,
            "details": execution.details
        })

    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit  # Arredondamento para cima
    }


@r.get("/executions/{id}")
def get_execution_details(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """
    Retorna detalhes completos de uma execução específica do scheduler.

    Args:
        id: ID da execução

    Returns:
        Objeto completo da execução com lista detalhada de casos liberados
    """
    execution = db.query(SLAExecution).get(id)

    if not execution:
        raise HTTPException(404, f"Execução #{id} não encontrada")

    # Buscar nome do usuário executor
    executed_by_name = None
    if execution.executed_by_user_id:
        executed_by = db.query(User).get(execution.executed_by_user_id)
        executed_by_name = executed_by.name if executed_by else "Usuário removido"

    return {
        "id": execution.id,
        "executed_at": execution.executed_at.isoformat(),
        "execution_type": execution.execution_type,
        "cases_expired_count": execution.cases_expired_count,
        "cases_released": execution.cases_released or [],
        "duration_seconds": float(execution.duration_seconds) if execution.duration_seconds else None,
        "executed_by": executed_by_name,
        "executed_by_user_id": execution.executed_by_user_id,
        "details": execution.details or {}
    }


@r.get("/export.csv")
def export_csv(
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    execution_type: Optional[str] = None,
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """
    Exporta execuções do scheduler em formato CSV.

    Args:
        from_: Data inicial (ISO 8601)
        to: Data final (ISO 8601)
        execution_type: Filtrar por tipo ('scheduled' ou 'manual')

    Returns:
        Arquivo CSV com todas as execuções
    """
    # Query base
    query = db.query(SLAExecution)

    # Filtros (mesma lógica do endpoint de listagem)
    filters = []

    if from_:
        try:
            from_date = datetime.fromisoformat(from_)
            filters.append(SLAExecution.executed_at >= from_date)
        except ValueError:
            raise HTTPException(400, "Data 'from' inválida")

    if to:
        try:
            to_date = datetime.fromisoformat(to)
            filters.append(SLAExecution.executed_at <= to_date)
        except ValueError:
            raise HTTPException(400, "Data 'to' inválida")

    if execution_type:
        if execution_type not in ["scheduled", "manual"]:
            raise HTTPException(400, "execution_type inválido")
        filters.append(SLAExecution.execution_type == execution_type)

    if filters:
        query = query.filter(and_(*filters))

    executions = query.order_by(SLAExecution.executed_at.desc()).all()

    # Criar CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Cabeçalho
    writer.writerow([
        "ID",
        "Data/Hora Execução",
        "Tipo",
        "Casos Expirados",
        "Casos Liberados",
        "Duração (s)",
        "Executado Por",
        "Processados",
        "Erros"
    ])

    # Dados
    for execution in executions:
        executed_by = "Sistema"
        if execution.executed_by_user_id:
            user_obj = db.query(User).get(execution.executed_by_user_id)
            executed_by = user_obj.name if user_obj else "Usuário removido"

        details = execution.details or {}
        processed = details.get("processed", 0)
        errors = details.get("errors", 0)

        writer.writerow([
            execution.id,
            execution.executed_at.strftime("%d/%m/%Y %H:%M:%S"),
            "Agendado" if execution.execution_type == "scheduled" else "Manual",
            execution.cases_expired_count,
            len(execution.cases_released or []),
            f"{float(execution.duration_seconds):.2f}" if execution.duration_seconds else "",
            executed_by,
            processed,
            errors
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sla_executions_{now_brt().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


@r.get("/statistics")
def get_statistics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    user=Depends(require_roles("admin", "supervisor"))
):
    """
    Retorna estatísticas gerais do sistema de SLA.

    Args:
        days: Número de dias para análise (padrão 30, máximo 365)

    Returns:
        Estatísticas agregadas:
        - Total de execuções
        - Média de casos por execução
        - Total de casos liberados
        - Execuções manuais vs automáticas
        - Taxa de erro
    """
    from datetime import timedelta

    since_date = now_brt() - timedelta(days=days)

    # Total de execuções no período
    total_executions = db.query(func.count(SLAExecution.id)).filter(
        SLAExecution.executed_at >= since_date
    ).scalar() or 0

    # Execuções por tipo
    scheduled_count = db.query(func.count(SLAExecution.id)).filter(
        SLAExecution.executed_at >= since_date,
        SLAExecution.execution_type == "scheduled"
    ).scalar() or 0

    manual_count = db.query(func.count(SLAExecution.id)).filter(
        SLAExecution.executed_at >= since_date,
        SLAExecution.execution_type == "manual"
    ).scalar() or 0

    # Total de casos expirados no período
    total_cases_expired = db.query(func.sum(SLAExecution.cases_expired_count)).filter(
        SLAExecution.executed_at >= since_date
    ).scalar() or 0

    # Média de casos por execução
    avg_cases_per_execution = total_cases_expired / total_executions if total_executions > 0 else 0

    # Duração média
    avg_duration = db.query(func.avg(SLAExecution.duration_seconds)).filter(
        SLAExecution.executed_at >= since_date
    ).scalar() or 0

    # Última execução
    last_execution = db.query(SLAExecution).order_by(
        SLAExecution.executed_at.desc()
    ).first()

    last_execution_data = None
    if last_execution:
        last_execution_data = {
            "id": last_execution.id,
            "executed_at": last_execution.executed_at.isoformat(),
            "execution_type": last_execution.execution_type,
            "cases_expired_count": last_execution.cases_expired_count
        }

    return {
        "period_days": days,
        "total_executions": total_executions,
        "scheduled_executions": scheduled_count,
        "manual_executions": manual_count,
        "total_cases_expired": int(total_cases_expired),
        "avg_cases_per_execution": round(avg_cases_per_execution, 2),
        "avg_duration_seconds": round(float(avg_duration), 2) if avg_duration else 0,
        "last_execution": last_execution_data,
        "generated_at": now_brt().isoformat()
    }
