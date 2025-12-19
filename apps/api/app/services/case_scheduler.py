"""
Serviço de scheduler para gerenciamento automático de casos.

Este módulo implementa:
- Verificação de casos expirados (48h úteis)
- Retorno automático para esteira
- Preservação de histórico de atribuições
- Desatribuição automática de atendentes
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from ..db import SessionLocal
from ..models import (
    Case, CaseEvent, User, now_brt, Comment, Attachment, ClientPhone,
    SLAExecution
)
import logging

logger = logging.getLogger(__name__)


class CaseScheduler:
    """
    Scheduler responsável por gerenciar a expiração de casos automaticamente.
    """

    def __init__(self, db_session: Session = None):
        self.db = db_session or SessionLocal()

    def has_case_interaction(self, case_id: int, since_date: datetime) -> bool:
        """
        Verifica se houve alguma interação no caso após uma data específica.

        Args:
            case_id: ID do caso
            since_date: Data de referência (normalmente a data de atribuição)

        Returns:
            bool: True se houver interação, False caso contrário
        """
        # Verificar comentários
        comments_count = self.db.query(func.count(Comment.id)).filter(
            Comment.case_id == case_id,
            Comment.created_at > since_date
        ).scalar() or 0

        if comments_count > 0:
            return True

        # Verificar anexos
        attachments_count = self.db.query(func.count(Attachment.id)).filter(
            Attachment.case_id == case_id,
            Attachment.created_at > since_date
        ).scalar() or 0

        if attachments_count > 0:
            return True

        # Verificar telefones registrados (via client_id do caso)
        case = self.db.query(Case).get(case_id)
        if case and case.client_id:
            phones_count = self.db.query(func.count(ClientPhone.id)).filter(
                ClientPhone.client_id == case.client_id,
                ClientPhone.created_at > since_date
            ).scalar() or 0

            if phones_count > 0:
                return True

        return False

    def process_expired_cases(self, execution_type: str = "scheduled", user_id: int = None) -> dict:
        """
        Processa todos os casos expirados, retornando-os para a esteira global.

        Args:
            execution_type: Tipo de execução ('scheduled' ou 'manual')
            user_id: ID do usuário que executou (None para execuções automáticas)

        Returns:
            dict: Estatísticas do processamento
        """
        logger.info(f"Iniciando processamento de casos expirados (tipo: {execution_type})...")

        start_time = now_brt()
        now = start_time
        stats = {
            "processed": 0,
            "expired": 0,
            "errors": 0,
            "already_expired": 0
        }
        cases_released = []  # Lista para auditoria

        try:
            # Buscar casos que expiraram
            expired_cases = self.db.query(Case).options(
                joinedload(Case.client),
                joinedload(Case.assigned_user)
            ).filter(
                Case.assigned_user_id.isnot(None),
                Case.assignment_expires_at.isnot(None),
                Case.assignment_expires_at <= now,
                Case.status.in_(["em_atendimento", "calculista_pendente"])
            ).all()

            logger.info(f"Encontrados {len(expired_cases)} casos expirados")

            for case in expired_cases:
                try:
                    stats["processed"] += 1

                    # Verificar se já foi processado
                    if not case.assigned_user_id:
                        stats["already_expired"] += 1
                        continue

                    # Buscar dados do usuário para histórico
                    user = self.db.query(User).filter(User.id == case.assigned_user_id).first()
                    user_name = user.name if user else "Usuário não encontrado"

                    # Adicionar ao histórico
                    if not case.assignment_history:
                        case.assignment_history = []

                    case.assignment_history.append({
                        "user_id": case.assigned_user_id,
                        "user_name": user_name,
                        "assigned_at": case.assigned_at.isoformat() if case.assigned_at else None,
                        "expired_at": now.isoformat(),
                        "action": "auto_expired",
                        "reason": "48_business_hours_exceeded"  # Atualizado de 72h para 48h úteis
                    })

                    # Resetar atribuição
                    original_user_id = case.assigned_user_id
                    case.assigned_user_id = None
                    case.status = "novo"  # ✅ Corrigido: usar "novo" em vez de "disponivel"
                    case.assigned_at = None
                    case.assignment_expires_at = None
                    case.last_update_at = now

                    # Criar evento
                    self.db.add(CaseEvent(
                        case_id=case.id,
                        type="case.auto_expired",
                        payload={
                            "original_user_id": original_user_id,
                            "expired_at": now.isoformat(),
                            "reason": "48h_limit_exceeded"  # ✅ Corrigido: padronizado para 48h
                        },
                        created_by=None  # Sistema automático
                    ))

                    stats["expired"] += 1
                    logger.info(f"Caso {case.id} expirado e retornado para esteira")

                    # Adicionar à lista de auditoria
                    had_interaction = (
                        self.has_case_interaction(case.id, case.assigned_at) 
                        if case.assigned_at else False
                    )
                    cases_released.append({
                        "case_id": case.id,
                        "client_id": case.client_id,
                        "client_name": case.client.name if case.client else "Desconhecido",
                        "client_cpf": case.client.cpf if case.client else "",
                        "assigned_user": user_name,
                        "assigned_user_id": original_user_id,
                        "reason": (
                            "expired_with_interaction" if had_interaction 
                            else "expired_no_interaction"
                        )
                    })

                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"Erro ao processar caso {case.id}: {str(e)}")

            # Registrar execução na tabela de auditoria
            duration_seconds = (now_brt() - start_time).total_seconds()
            sla_execution = SLAExecution(
                executed_at=start_time,
                execution_type=execution_type,
                cases_expired_count=stats["expired"],
                cases_released=cases_released,
                executed_by_user_id=user_id,
                duration_seconds=duration_seconds,
                details={
                    "processed": stats["processed"],
                    "errors": stats["errors"],
                    "already_expired": stats["already_expired"],
                    "total_cases_found": len(expired_cases)
                }
            )
            self.db.add(sla_execution)

            # Commit todas as alterações
            self.db.commit()

            logger.info(f"Processamento concluído: {stats}")
            logger.info(f"Auditoria registrada: execução #{sla_execution.id}")
            return stats

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro durante processamento de casos expirados: {str(e)}")
            stats["errors"] += 1
            return stats

    def get_cases_near_expiry(self, hours_before: int = 2) -> list:
        """
        Retorna casos que estão próximos de expirar (para notificações).

        Args:
            hours_before: Quantas horas antes da expiração considerar

        Returns:
            list: Lista de casos próximos do vencimento
        """
        warning_time = now_brt() + timedelta(hours=hours_before)

        near_expiry_cases = self.db.query(Case).filter(
            Case.assigned_user_id.isnot(None),
            Case.assignment_expires_at.isnot(None),
            Case.assignment_expires_at <= warning_time,
            Case.assignment_expires_at > now_brt(),
            Case.status.in_(["em_atendimento", "calculista_pendente"])
        ).all()

        return [
            {
                "case_id": case.id,
                "assigned_user_id": case.assigned_user_id,
                "expires_at": case.assignment_expires_at.isoformat(),
                "hours_remaining": (case.assignment_expires_at - now_brt()).total_seconds() / 3600,
                "client_name": case.client.name if case.client else None
            }
            for case in near_expiry_cases
        ]

    def get_assignment_statistics(self, days: int = 7) -> dict:
        """
        Retorna estatísticas de atribuições dos últimos N dias.

        Args:
            days: Número de dias para análise

        Returns:
            dict: Estatísticas detalhadas
        """
        since = now_brt() - timedelta(days=days)

        # Casos atribuídos no período
        assigned_count = self.db.query(func.count(Case.id)).filter(
            Case.assigned_at >= since
        ).scalar() or 0

        # Casos expirados no período
        expired_events = self.db.query(func.count(CaseEvent.id)).filter(
            CaseEvent.type == "case.auto_expired",
            CaseEvent.created_at >= since
        ).scalar() or 0

        # Casos liberados manualmente no período
        released_events = self.db.query(func.count(CaseEvent.id)).filter(
            CaseEvent.type == "case.released",
            CaseEvent.created_at >= since
        ).scalar() or 0

        # Casos atualmente atribuídos
        currently_assigned = self.db.query(func.count(Case.id)).filter(
            Case.assigned_user_id.isnot(None),
            Case.assignment_expires_at > now_brt()
        ).scalar() or 0

        return {
            "period_days": days,
            "assigned_count": assigned_count,
            "expired_count": expired_events,
            "released_count": released_events,
            "currently_assigned": currently_assigned,
            "generated_at": now_brt().isoformat()
        }

    def close(self):
        """Fecha a conexão com o banco de dados se foi criada pelo scheduler."""
        if hasattr(self, '_created_db'):
            self.db.close()


def run_scheduler_maintenance():
    """
    Função principal para execução do scheduler.
    Pode ser chamada por um cron job ou serviço em background.
    """
    scheduler = CaseScheduler()
    try:
        logger.info("=== Iniciando manutenção automática do scheduler ===")

        # Processar casos expirados
        stats = scheduler.process_expired_cases()

        # Log de estatísticas
        logger.info(f"Manutenção concluída: {stats}")

        return stats

    except Exception as e:
        logger.error(f"Erro durante manutenção do scheduler: {str(e)}")
        return {"error": str(e)}
    finally:
        scheduler.close()


if __name__ == "__main__":
    # Permite execução direta do script
    import logging

    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Executar manutenção
    result = run_scheduler_maintenance()
    print(f"Resultado: {result}")
