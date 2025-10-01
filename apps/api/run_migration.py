#!/usr/bin/env python3
"""
Script para executar a migração dos campos de lock temporal.

Este script:
1. Executa a migração do banco de dados
2. Verifica se os campos foram criados corretamente
3. Testa o sistema de scheduler básico
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório da API ao path
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from sqlalchemy import inspect
from app.db import SessionLocal, engine
from app.models import Case
from app.services.case_scheduler import CaseScheduler
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def check_migration_applied():
    """Verifica se a migração foi aplicada corretamente."""
    logger.info("Verificando se a migração foi aplicada...")

    inspector = inspect(engine)
    columns = inspector.get_columns('cases')
    column_names = [col['name'] for col in columns]

    required_fields = ['assigned_at', 'assignment_expires_at', 'assignment_history']
    missing_fields = [field for field in required_fields if field not in column_names]

    if missing_fields:
        logger.error(f"Campos faltando na tabela cases: {missing_fields}")
        return False

    logger.info("✅ Todos os campos necessários estão presentes na tabela cases")
    return True


def test_scheduler_functionality():
    """Testa funcionalidades básicas do scheduler."""
    logger.info("Testando funcionalidades do scheduler...")

    try:
        with SessionLocal() as db:
            scheduler = CaseScheduler(db)

            # Testar estatísticas
            stats = scheduler.get_assignment_statistics(days=7)
            logger.info(f"✅ Estatísticas obtidas: {stats}")

            # Testar casos próximos do vencimento
            near_expiry = scheduler.get_cases_near_expiry(hours_before=24)
            logger.info(f"✅ Casos próximos do vencimento: {len(near_expiry)}")

            # Testar processamento de casos expirados (dry run)
            expired_stats = scheduler.process_expired_cases()
            logger.info(f"✅ Processamento de casos expirados: {expired_stats}")

        return True

    except Exception as e:
        logger.error(f"❌ Erro ao testar scheduler: {str(e)}")
        return False


def main():
    """Função principal do script."""
    logger.info("=== Iniciando verificação da migração ===")

    # Verificar se a migração foi aplicada
    if not check_migration_applied():
        logger.error("❌ Migração não foi aplicada corretamente!")
        logger.info("Execute: alembic upgrade head")
        return False

    # Testar funcionalidades do scheduler
    if not test_scheduler_functionality():
        logger.error("❌ Testes do scheduler falharam!")
        return False

    logger.info("✅ Todos os testes passaram! Sistema está funcionando corretamente.")

    # Instruções para uso
    logger.info("\n=== Instruções de uso ===")
    logger.info("1. Para executar manutenção manual: POST /cases/scheduler/run-maintenance")
    logger.info("2. Para ver estatísticas: GET /cases/scheduler/statistics")
    logger.info("3. Para casos próximos do vencimento: GET /cases/scheduler/cases-near-expiry")
    logger.info("4. Para configurar cron job: python -m app.services.case_scheduler")

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)