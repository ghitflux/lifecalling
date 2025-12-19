"""
Configuração do APScheduler para execução automática do sistema de SLA.

Este módulo configura e inicializa o scheduler que executa automaticamente
a verificação de casos expirados todos os dias às 18h (horário de Brasília).
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
import logging

logger = logging.getLogger(__name__)

# Criar instância do scheduler
scheduler = BackgroundScheduler()


def process_expired_cases_job():
    """
    Job executado automaticamente pelo APScheduler.
    Processa casos expirados e registra na tabela de auditoria.
    """
    from .services.case_scheduler import CaseScheduler
    from .db import SessionLocal

    logger.info("=== Iniciando job automático de SLA (APScheduler) ===")

    db = SessionLocal()
    case_scheduler = CaseScheduler(db)

    try:
        stats = case_scheduler.process_expired_cases(
            execution_type="scheduled",
            user_id=None  # Execução automática
        )

        logger.info(f"Job de SLA concluído com sucesso: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Erro durante job de SLA: {str(e)}")
        return {"error": str(e)}

    finally:
        db.close()


def init_scheduler():
    """
    Inicializa o scheduler com a configuração de execução diária às 18h BRT.
    """
    # Timezone de Brasília
    brasilia_tz = pytz.timezone('America/Sao_Paulo')

    # Configurar trigger para executar todo dia às 18h (horário de Brasília)
    trigger = CronTrigger(
        hour=18,
        minute=0,
        timezone=brasilia_tz
    )

    # Adicionar job ao scheduler
    scheduler.add_job(
        process_expired_cases_job,
        trigger=trigger,
        id='sla_check_daily',
        name='SLA - Verificação diária de casos expirados',
        replace_existing=True,
        misfire_grace_time=3600  # 1 hora de tolerância se o servidor estiver offline
    )

    logger.info("✅ Scheduler de SLA configurado: execução diária às 18h BRT")

    # Iniciar o scheduler
    scheduler.start()
    logger.info("✅ Scheduler de SLA iniciado com sucesso")


def shutdown_scheduler():
    """
    Desliga o scheduler gracefully.
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info("✅ Scheduler de SLA desligado com sucesso")
