"""
Serviço de scheduler para gerenciamento automático de casos.

Este módulo implementa:
- Verificação de casos expirados (72 horas)
- Retorno automático para esteira
- Preservação de histórico de atribuições
- Desatribuição automática de atendentes
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import SessionLocal
from ..models import Case, CaseEvent, User
import logging

logger = logging.getLogger(__name__)


class CaseScheduler:
    """
    Scheduler responsável por gerenciar a expiração de casos automaticamente.
    """

    def __init__(self, db_session: Session = None):
        self.db = db_session or SessionLocal()

    def process_expired_cases(self) -> dict:
        """
        Processa todos os casos expirados, retornando-os para a esteira global.

        Returns:
            dict: Estatísticas do processamento
        """
        logger.info("Iniciando processamento de casos expirados...")

        now = datetime.utcnow()
        stats = {
            "processed": 0,
            "expired": 0,
            "errors": 0,
            "already_expired": 0
        }

        try:
            # Buscar casos que expiraram
            expired_cases = self.db.query(Case).filter(
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
                        "reason": "72_hour_limit_exceeded"
                    })

                    # Resetar atribuição
                    original_user_id = case.assigned_user_id
                    case.assigned_user_id = None
                    case.status = "disponivel"
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
                            "reason": "72_hour_limit_exceeded"
                        },
                        created_by=None  # Sistema automático
                    ))

                    stats["expired"] += 1
                    logger.info(f"Caso {case.id} expirado e retornado para esteira")

                except Exception as e:
                    stats["errors"] += 1
                    logger.error(f"Erro ao processar caso {case.id}: {str(e)}")

            # Commit todas as alterações
            self.db.commit()

            logger.info(f"Processamento concluído: {stats}")
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
        warning_time = datetime.utcnow() + timedelta(hours=hours_before)

        near_expiry_cases = self.db.query(Case).filter(
            Case.assigned_user_id.isnot(None),
            Case.assignment_expires_at.isnot(None),
            Case.assignment_expires_at <= warning_time,
            Case.assignment_expires_at > datetime.utcnow(),
            Case.status.in_(["em_atendimento", "calculista_pendente"])
        ).all()

        return [
            {
                "case_id": case.id,
                "assigned_user_id": case.assigned_user_id,
                "expires_at": case.assignment_expires_at.isoformat(),
                "hours_remaining": (case.assignment_expires_at - datetime.utcnow()).total_seconds() / 3600,
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
        since = datetime.utcnow() - timedelta(days=days)

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
            Case.assignment_expires_at > datetime.utcnow()
        ).scalar() or 0

        return {
            "period_days": days,
            "assigned_count": assigned_count,
            "expired_count": expired_events,
            "released_count": released_events,
            "currently_assigned": currently_assigned,
            "generated_at": datetime.utcnow().isoformat()
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
    import sys
    import os

    # Configurar logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Executar manutenção
    result = run_scheduler_maintenance()
    print(f"Resultado: {result}")