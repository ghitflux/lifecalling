#!/usr/bin/env python3
"""
Script para limpar todos os seeds e dados mockados do banco.

Este script remove:
- Casos de teste/seed
- Clientes de teste
- Importações de seed
- Contratos mockados
- Eventos e anexos associados
"""

import sys
from pathlib import Path

# Adicionar o diretório da API ao path
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from sqlalchemy import text, func
from app.db import SessionLocal
from app.models import (
    Case, Client, ImportBatch, ImportRow, CaseEvent, Attachment,
    PayrollClient, PayrollContract, PayrollImportBatch, PayrollImportItem,
    Simulation, Contract, ContractAttachment, Payment, Notification
)
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def count_records(db):
    """Conta registros em todas as tabelas antes da limpeza."""
    counts = {}

    tables = [
        ('cases', Case),
        ('clients', Client),
        ('import_batches', ImportBatch),
        ('import_rows', ImportRow),
        ('case_events', CaseEvent),
        ('attachments', Attachment),
        ('payroll_clients', PayrollClient),
        ('payroll_contracts', PayrollContract),
        ('payroll_import_batches', PayrollImportBatch),
        ('payroll_import_items', PayrollImportItem),
        ('simulations', Simulation),
        ('contracts', Contract),
        ('contract_attachments', ContractAttachment),
        ('payments', Payment),
        ('notifications', Notification)
    ]

    for name, model in tables:
        try:
            count = db.query(func.count(model.id)).scalar()
            counts[name] = count
        except Exception as e:
            logger.warning(f"Erro ao contar {name}: {e}")
            counts[name] = 0

    return counts


def cleanup_all_data(db):
    """Remove todos os dados das tabelas, preservando usuários."""
    logger.info("Iniciando limpeza completa dos dados...")

    try:
        deleted_counts = {}

        # Passo 1: Limpar foreign keys problemáticas primeiro
        logger.info("🔧 Passo 1: Limpando foreign keys problemáticas...")

        # Limpar last_simulation_id de cases
        result = db.execute(text("UPDATE cases SET last_simulation_id = NULL"))
        logger.info(f"Removidas {result.rowcount} referências last_simulation_id")

        # Limpar assigned_user_id se necessário (manter usuários)
        # result = db.execute(text("UPDATE cases SET assigned_user_id = NULL"))
        # logger.info(f"Removidas {result.rowcount} referências assigned_user_id")

        db.commit()

        # Passo 2: Remover dados em ordem segura
        logger.info("🗑️ Passo 2: Removendo dados...")

        cleanup_order = [
            # Tabelas dependentes primeiro
            (Notification, "notifications"),
            (Payment, "payments"),
            (ContractAttachment, "contract_attachments"),
            (Contract, "contracts"),
            (Simulation, "simulations"),
            (Attachment, "attachments"),
            (CaseEvent, "case_events"),
            (PayrollImportItem, "payroll_import_items"),
            (PayrollContract, "payroll_contracts"),
            (ImportRow, "import_rows"),

            # Tabelas intermediárias
            (Case, "cases"),
            (PayrollImportBatch, "payroll_import_batches"),
            (ImportBatch, "import_batches"),

            # Tabelas principais
            (PayrollClient, "payroll_clients"),
            (Client, "clients"),
        ]

        for model, table_name in cleanup_order:
            try:
                count_before = db.query(func.count(model.id)).scalar()
                if count_before > 0:
                    db.query(model).delete()
                    db.flush()
                    logger.info(f"✅ Removidos {count_before} registros de {table_name}")
                    deleted_counts[table_name] = count_before
                else:
                    logger.info(f"📭 Tabela {table_name} já estava vazia")
                    deleted_counts[table_name] = 0
            except Exception as e:
                logger.error(f"❌ Erro ao limpar {table_name}: {e}")
                deleted_counts[table_name] = f"ERRO: {e}"
                # Continuar mesmo com erro

        # Commit todas as alterações
        db.commit()
        logger.info("✅ Limpeza concluída com sucesso!")

        return deleted_counts

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro durante limpeza: {e}")
        raise


def reset_sequences(db):
    """Reseta sequências de IDs para começar do 1."""
    logger.info("Resetando sequências de IDs...")

    sequences = [
        'cases_id_seq',
        'clients_id_seq',
        'imports_id_seq',
        'import_rows_id_seq',
        'case_events_id_seq',
        'attachments_id_seq',
        'payroll_clients_id_seq',
        'payroll_contracts_id_seq',
        'payroll_import_batches_id_seq',
        'payroll_import_items_id_seq',
        'simulations_id_seq',
        'contracts_id_seq',
        'contract_attachments_id_seq',
        'payments_id_seq',
        'notifications_id_seq'
    ]

    for seq in sequences:
        try:
            db.execute(text(f"ALTER SEQUENCE {seq} RESTART WITH 1"))
            logger.info(f"Sequence {seq} resetada")
        except Exception as e:
            logger.warning(f"Não foi possível resetar {seq}: {e}")

    db.commit()


def main():
    """Função principal do script."""
    logger.info("=== Iniciando limpeza de seeds e dados mockados ===")

    with SessionLocal() as db:
        # Contar registros antes
        logger.info("📊 Contando registros antes da limpeza...")
        counts_before = count_records(db)

        total_before = sum(c for c in counts_before.values() if isinstance(c, int))
        logger.info(f"Total de registros antes: {total_before}")

        for table, count in counts_before.items():
            if count > 0:
                logger.info(f"  {table}: {count}")

        if total_before == 0:
            logger.info("✅ Banco já está limpo!")
            return True

        # Confirmar limpeza
        logger.info("\n⚠️  ATENÇÃO: Esta operação irá remover TODOS os dados das tabelas!")
        logger.info("Usuários serão preservados, mas todos os outros dados serão perdidos.")

        # Executar limpeza
        logger.info("\n🧹 Executando limpeza...")
        deleted_counts = cleanup_all_data(db)

        # Resetar sequências
        reset_sequences(db)

        # Contar registros depois
        logger.info("\n📊 Verificando resultado...")
        counts_after = count_records(db)
        total_after = sum(c for c in counts_after.values() if isinstance(c, int))

        # Resumo
        logger.info(f"\n✅ Limpeza concluída!")
        logger.info(f"Registros antes: {total_before}")
        logger.info(f"Registros depois: {total_after}")
        logger.info(f"Registros removidos: {total_before - total_after}")

        if total_after == 0:
            logger.info("🎉 Banco completamente limpo!")
        else:
            logger.warning(f"⚠️  Ainda restam {total_after} registros (provavelmente usuários)")

        return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        sys.exit(1)