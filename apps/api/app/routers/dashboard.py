from fastapi import APIRouter, Depends
from ..rbac import require_roles
from ..db import SessionLocal
from ..models import Case, Simulation, Contract
from sqlalchemy import func
from datetime import datetime, timedelta

r = APIRouter(prefix="/dashboard", tags=["dashboard"])

@r.get("/stats")
def dashboard_stats(user=Depends(require_roles("admin","supervisor"))):
    with SessionLocal() as db:
        # Total de casos
        total_cases = db.query(Case).count()

        # Casos ativos (não finalizados)
        active_cases = db.query(Case).filter(
            ~Case.status.in_(["finalizado", "cancelado"])
        ).count()

        # Simulações pendentes
        pending_simulations = db.query(Simulation).filter(
            Simulation.status == "pending"
        ).count()

        # Volume financeiro (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        total_volume = db.query(func.sum(Contract.total_amount)).filter(
            Contract.created_at >= thirty_days_ago
        ).scalar() or 0

        # Taxa de aprovação aproximada
        approved_cases = db.query(Case).filter(
            Case.status.in_(["fechamento_aprovado", "contrato_efetivado"])
        ).count()
        approval_rate = (approved_cases / total_cases * 100) if total_cases > 0 else 0

        return {
            "totalCases": total_cases,
            "activeCases": active_cases,
            "pendingSimulations": pending_simulations,
            "approvalRate": round(approval_rate, 1),
            "totalVolume": float(total_volume),
            "monthlyTarget": 3000000
        }

@r.get("/status-breakdown")
def status_breakdown(user=Depends(require_roles("admin","supervisor"))):
    with SessionLocal() as db:
        # Contar casos por status
        status_counts = db.query(
            Case.status,
            func.count(Case.id)
        ).group_by(Case.status).all()

        breakdown = {}
        for status, count in status_counts:
            breakdown[status] = count

        return {
            "novo": breakdown.get("novo", 0),
            "em_atendimento": breakdown.get("em_atendimento", 0),
            "calculista_pendente": breakdown.get("calculista_pendente", 0),
            "calculo_aprovado": breakdown.get("calculo_aprovado", 0),
            "fechamento_aprovado": breakdown.get("fechamento_aprovado", 0),
            "contrato_efetivado": breakdown.get("contrato_efetivado", 0)
        }

@r.get("/daily-performance")
def daily_performance(user=Depends(require_roles("admin","supervisor"))):
    from ..models import CaseEvent

    with SessionLocal() as db:
        today = datetime.utcnow().date()

        # Eventos de hoje
        today_events = db.query(CaseEvent).filter(
            func.date(CaseEvent.created_at) == today
        ).all()

        # Contar por tipo de evento
        approved_today = len([e for e in today_events if e.type == "simulation.approved"])
        simulations_today = len([e for e in today_events if e.type == "case.to_calculista"])
        contracts_today = len([e for e in today_events if e.type == "finance.disbursed"])

        return {
            "casosAprovados": approved_today,
            "simulacoesFeitas": simulations_today,
            "contratosFechados": contracts_today
        }

@r.get("/chart-data")
def chart_data(period: str = "6m", user=Depends(require_roles("admin","supervisor"))):
    with SessionLocal() as db:
        # Dados para gráfico dos últimos 6 meses
        months = []
        current_date = datetime.utcnow().replace(day=1)

        for i in range(6):
            month_start = current_date.replace(month=current_date.month - i)
            if month_start.month <= 0:
                month_start = month_start.replace(
                    year=month_start.year - 1,
                    month=month_start.month + 12
                )

            month_end = month_start.replace(
                month=month_start.month + 1 if month_start.month < 12 else 1,
                year=month_start.year if month_start.month < 12 else month_start.year + 1
            )

            # Contar casos do mês
            cases_count = db.query(Case).filter(
                Case.last_update_at >= month_start,
                Case.last_update_at < month_end
            ).count()

            months.append({
                "month": month_start.strftime("%b"),
                "value": cases_count
            })

        # Reverter para ordem cronológica
        months.reverse()

        return {"data": months}

@r.get("/user-performance")
def user_performance(user=Depends(require_roles("admin","supervisor"))):
    with SessionLocal() as db:
        from ..models import User

        # Performance por usuário nos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        users = db.query(User).filter(User.role.in_(["atendente", "calculista"])).all()
        performance_data = []

        for user_obj in users:
            # Casos atribuídos ao usuário
            assigned_cases = db.query(Case).filter(
                Case.assigned_user_id == user_obj.id,
                Case.last_update_at >= thirty_days_ago
            ).count()

            # Casos finalizados pelo usuário
            completed_cases = db.query(Case).filter(
                Case.assigned_user_id == user_obj.id,
                Case.status.in_(["fechamento_aprovado", "contrato_efetivado"]),
                Case.last_update_at >= thirty_days_ago
            ).count()

            performance_data.append({
                "name": user_obj.name,
                "assigned": assigned_cases,
                "completed": completed_cases,
                "efficiency": round((completed_cases / assigned_cases * 100) if assigned_cases > 0 else 0, 1)
            })

        return {"data": performance_data}

@r.get("/monthly-trends")
def monthly_trends(user=Depends(require_roles("admin","supervisor"))):
    with SessionLocal() as db:
        # Tendências dos últimos 12 meses
        months = []
        current_date = datetime.utcnow().replace(day=1)

        for i in range(12):
            month_start = current_date.replace(month=current_date.month - i)
            if month_start.month <= 0:
                month_start = month_start.replace(
                    year=month_start.year - 1,
                    month=month_start.month + 12
                )

            month_end = month_start.replace(
                month=month_start.month + 1 if month_start.month < 12 else 1,
                year=month_start.year if month_start.month < 12 else month_start.year + 1
            )

            # Casos novos
            new_cases = db.query(Case).filter(
                Case.created_at >= month_start,
                Case.created_at < month_end
            ).count()

            # Casos finalizados
            completed_cases = db.query(Case).filter(
                Case.last_update_at >= month_start,
                Case.last_update_at < month_end,
                Case.status.in_(["fechamento_aprovado", "contrato_efetivado"])
            ).count()

            # Volume financeiro
            total_volume = db.query(func.sum(Contract.total_amount)).filter(
                Contract.created_at >= month_start,
                Contract.created_at < month_end
            ).scalar() or 0

            months.append({
                "month": month_start.strftime("%b/%y"),
                "novos": new_cases,
                "finalizados": completed_cases,
                "volume": float(total_volume)
            })

        # Reverter para ordem cronológica
        months.reverse()
        return {"data": months}

@r.get("/my-stats")
def my_stats(user=Depends(require_roles("atendente","calculista","supervisor","admin"))):
    """Métricas específicas do atendente logado"""
    with SessionLocal() as db:
        from ..security import get_current_user

        # Casos atribuídos ao usuário atual
        my_cases = db.query(Case).filter(Case.assigned_user_id == user.id)

        # Total de casos do usuário
        total_my_cases = my_cases.count()

        # Casos ativos (não finalizados)
        active_my_cases = my_cases.filter(
            ~Case.status.in_(["finalizado", "cancelado", "fechamento_aprovado", "contrato_efetivado"])
        ).count()

        # Casos finalizados com sucesso
        completed_my_cases = my_cases.filter(
            Case.status.in_(["fechamento_aprovado", "contrato_efetivado"])
        ).count()

        # Taxa de conversão do usuário
        conversion_rate = (completed_my_cases / total_my_cases * 100) if total_my_cases > 0 else 0

        # Casos pendentes de ação do usuário
        pending_my_cases = my_cases.filter(
            Case.status.in_(["em_atendimento", "calculista_pendente"])
        ).count()

        # Volume financeiro dos casos do usuário (últimos 30 dias)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        my_volume = db.query(func.sum(Contract.total_amount)).join(Case).filter(
            Case.assigned_user_id == user.id,
            Contract.created_at >= thirty_days_ago
        ).scalar() or 0

        # Média de tempo de atendimento (em dias)
        completed_cases_with_time = my_cases.filter(
            Case.status.in_(["fechamento_aprovado", "contrato_efetivado"]),
            Case.created_at.isnot(None),
            Case.last_update_at.isnot(None)
        ).all()

        avg_handling_time = 0
        if completed_cases_with_time:
            total_days = sum([
                (case.last_update_at - case.created_at).days
                for case in completed_cases_with_time
            ])
            avg_handling_time = total_days / len(completed_cases_with_time)

        return {
            "totalCases": total_my_cases,
            "activeCases": active_my_cases,
            "completedCases": completed_my_cases,
            "pendingCases": pending_my_cases,
            "conversionRate": round(conversion_rate, 1),
            "totalVolume": float(my_volume),
            "avgHandlingTime": round(avg_handling_time, 1)
        }
