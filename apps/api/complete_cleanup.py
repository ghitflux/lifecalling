#!/usr/bin/env python3
"""
Script completo de limpeza para todos os módulos do sistema.

Este script remove:
- Atendimentos com erro ou status problemático
- Dados seed de todos os módulos
- Importações antigas
- Contratos e pagamentos
- Simulações e anexos
- Notificações
- Eventos e histórico

MANTÉM APENAS:
- Usuários do sistema
- Estrutura das tabelas
- Configurações essenciais
"""

import sys
from pathlib import Path
import logging
from datetime import datetime

# Adicionar o diretório da API ao path
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from sqlalchemy import text, func, and_, or_
from app.db import SessionLocal
from app.models import (
    # Módulo principal
    Case, Client, CaseEvent, Attachment,

    # Módulo de importações
    ImportBatch, ImportRow,
    PayrollImportBatch, PayrollImportItem,
    PayrollClient, PayrollContract,

    # Módulo de simulações
    Simulation,

    # Módulo de contratos
    Contract, ContractAttachment, Payment,

    # Módulo de notificações
    Notification,

    # Módulo de usuários (PRESERVAR)
    User
)

# Configurar logging detalhado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('cleanup.log', mode='w', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


class CompleteCleanup:
    """Classe para limpeza completa e segura do sistema."""

    def __init__(self):
        self.db = SessionLocal()
        self.stats = {
            "before": {},
            "deleted": {},
            "after": {},
            "sequences_reset": [],
            "errors": []
        }

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()

    def count_all_records(self) -> dict:
        """Conta registros em todas as tabelas."""
        tables = [
            ('users', User),
            ('cases', Case),
            ('clients', Client),
            ('case_events', CaseEvent),
            ('attachments', Attachment),
            ('import_batches', ImportBatch),
            ('import_rows', ImportRow),
            ('payroll_import_batches', PayrollImportBatch),
            ('payroll_import_items', PayrollImportItem),
            ('payroll_clients', PayrollClient),
            ('payroll_contracts', PayrollContract),
            ('simulations', Simulation),
            ('contracts', Contract),
            ('contract_attachments', ContractAttachment),
            ('payments', Payment),
            ('notifications', Notification)
        ]

        counts = {}
        for name, model in tables:
            try:
                count = self.db.query(func.count(model.id)).scalar() or 0
                counts[name] = count
            except Exception as e:
                logger.warning(f"Erro ao contar {name}: {e}")
                counts[name] = 0

        return counts

    def analyze_problematic_cases(self):
        """Analisa cases com problemas específicos."""
        logger.info("🔍 Analisando cases problemáticos...")

        try:
            # Cases com status de erro
            error_cases = self.db.query(Case).filter(
                or_(
                    Case.status.like('%erro%'),
                    Case.status.like('%error%'),
                    Case.status.like('%failed%'),
                    Case.status == 'erro'
                )
            ).all()

            # Cases órfãos (sem cliente)
            orphan_cases = self.db.query(Case).filter(
                Case.client_id.is_(None)
            ).all()

            # Cases com client_id inválido
            invalid_client_cases = self.db.query(Case).filter(
                ~Case.client_id.in_(
                    self.db.query(Client.id)
                )
            ).all()

            # Cases com dados inconsistentes
            inconsistent_cases = self.db.query(Case).filter(
                and_(
                    Case.entidade.is_(None),
                    Case.referencia_competencia.is_(None),
                    Case.status == 'novo'
                )
            ).all()

            logger.info(f"  📊 Cases com status de erro: {len(error_cases)}")
            logger.info(f"  📊 Cases órfãos: {len(orphan_cases)}")
            logger.info(f"  📊 Cases com client_id inválido: {len(invalid_client_cases)}")
            logger.info(f"  📊 Cases inconsistentes: {len(inconsistent_cases)}")

            return {
                "error_cases": error_cases,
                "orphan_cases": orphan_cases,
                "invalid_client_cases": invalid_client_cases,
                "inconsistent_cases": inconsistent_cases
            }

        except Exception as e:
            logger.error(f"Erro ao analisar cases problemáticos: {e}")
            return {}

    def cleanup_foreign_keys(self):
        """Remove foreign keys problemáticas antes da limpeza principal."""
        logger.info("🔧 Limpando foreign keys problemáticas...")

        try:
            # Limpar referências last_simulation_id
            result1 = self.db.execute(text("UPDATE cases SET last_simulation_id = NULL"))
            logger.info(f"  ✅ Removidas {result1.rowcount} referências last_simulation_id")

            # Limpar referências assigned_user_id (preservar usuários válidos)
            valid_user_ids = [u.id for u in self.db.query(User.id).all()]
            if valid_user_ids:
                # Manter apenas assigned_user_id válidos
                result2 = self.db.execute(text(
                    f"UPDATE cases SET assigned_user_id = NULL WHERE assigned_user_id NOT IN ({','.join(map(str, valid_user_ids))})"
                ))
                logger.info(f"  ✅ Removidas {result2.rowcount} referências assigned_user_id inválidas")

            # Limpar referências de import_batch_id inválidas
            result3 = self.db.execute(text(
                "UPDATE cases SET import_batch_id = NULL WHERE import_batch_id NOT IN (SELECT id FROM imports)"
            ))
            logger.info(f"  ✅ Removidas {result3.rowcount} referências import_batch_id inválidas")

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao limpar foreign keys: {e}")
            self.stats["errors"].append(f"cleanup_foreign_keys: {e}")

    def cleanup_all_modules(self):
        """Remove dados de todos os módulos em ordem segura."""
        logger.info("🗑️ Iniciando limpeza de todos os módulos...")

        # Ordem de limpeza respeitando foreign keys
        cleanup_order = [
            # 1. Dados dependentes primeiro
            (Notification, "notifications", "Notificações do sistema"),
            (Payment, "payments", "Pagamentos de contratos"),
            (ContractAttachment, "contract_attachments", "Anexos de contratos"),
            (Contract, "contracts", "Contratos efetivados"),
            (Simulation, "simulations", "Simulações de calculista"),
            (Attachment, "attachments", "Anexos de casos"),
            (CaseEvent, "case_events", "Eventos e histórico de casos"),

            # 2. Dados de importação
            (PayrollImportItem, "payroll_import_items", "Itens de importação de folha"),
            (PayrollContract, "payroll_contracts", "Contratos de folha de pagamento"),
            (ImportRow, "import_rows", "Linhas de importação Santander"),

            # 3. Casos e clientes
            (Case, "cases", "Casos/Atendimentos"),

            # 4. Lotes de importação
            (PayrollImportBatch, "payroll_import_batches", "Lotes de importação de folha"),
            (ImportBatch, "import_batches", "Lotes de importação Santander"),

            # 5. Clientes (por último)
            (PayrollClient, "payroll_clients", "Clientes de folha de pagamento"),
            (Client, "clients", "Clientes principais"),
        ]

        for model, table_name, description in cleanup_order:
            try:
                count_before = self.db.query(func.count(model.id)).scalar() or 0

                if count_before > 0:
                    logger.info(f"  🧹 Limpando {description}...")

                    # Para casos problemáticos, fazer limpeza específica
                    if model == Case:
                        self._cleanup_cases_specifically()
                    else:
                        self.db.query(model).delete()

                    self.db.flush()
                    count_after = self.db.query(func.count(model.id)).scalar() or 0
                    deleted = count_before - count_after

                    logger.info(f"    ✅ {deleted} registros removidos de {table_name}")
                    self.stats["deleted"][table_name] = deleted
                else:
                    logger.info(f"    📭 {description} já estava vazio")
                    self.stats["deleted"][table_name] = 0

            except Exception as e:
                logger.error(f"    ❌ Erro ao limpar {table_name}: {e}")
                self.stats["errors"].append(f"{table_name}: {e}")
                # Continuar mesmo com erro

        try:
            self.db.commit()
            logger.info("✅ Limpeza de módulos concluída")
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Erro no commit final da limpeza: {e}")
            raise

    def _cleanup_cases_specifically(self):
        """Limpeza específica e cuidadosa de cases."""
        logger.info("    🎯 Limpeza específica de cases...")

        # Primeiro, cases com problemas específicos
        problem_cases = self.analyze_problematic_cases()

        total_deleted = 0

        # Remover cases com erro
        if problem_cases.get("error_cases"):
            error_count = len(problem_cases["error_cases"])
            for case in problem_cases["error_cases"]:
                self.db.delete(case)
            logger.info(f"      🔥 Removidos {error_count} cases com status de erro")
            total_deleted += error_count

        # Remover cases órfãos
        if problem_cases.get("orphan_cases"):
            orphan_count = len(problem_cases["orphan_cases"])
            for case in problem_cases["orphan_cases"]:
                self.db.delete(case)
            logger.info(f"      🔥 Removidos {orphan_count} cases órfãos")
            total_deleted += orphan_count

        # Remover cases com client_id inválido
        if problem_cases.get("invalid_client_cases"):
            invalid_count = len(problem_cases["invalid_client_cases"])
            for case in problem_cases["invalid_client_cases"]:
                self.db.delete(case)
            logger.info(f"      🔥 Removidos {invalid_count} cases com client_id inválido")
            total_deleted += invalid_count

        # Remover todos os cases restantes (limpeza completa)
        remaining_cases = self.db.query(Case).all()
        if remaining_cases:
            remaining_count = len(remaining_cases)
            for case in remaining_cases:
                self.db.delete(case)
            logger.info(f"      🧹 Removidos {remaining_count} cases restantes")
            total_deleted += remaining_count

        logger.info(f"    ✅ Total de cases removidos: {total_deleted}")

    def reset_sequences(self):
        """Reseta todas as sequências de ID para começar do 1."""
        logger.info("🔄 Resetando sequências de IDs...")

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
                self.db.execute(text(f"ALTER SEQUENCE {seq} RESTART WITH 1"))
                self.stats["sequences_reset"].append(seq)
                logger.info(f"  ✅ Sequence {seq} resetada")
            except Exception as e:
                logger.warning(f"  ⚠️ Não foi possível resetar {seq}: {e}")

        try:
            self.db.commit()
            logger.info("✅ Reset de sequências concluído")
        except Exception as e:
            logger.error(f"❌ Erro no commit do reset: {e}")

    def verify_cleanup(self):
        """Verifica se a limpeza foi bem-sucedida."""
        logger.info("🔍 Verificando resultado da limpeza...")

        final_counts = self.count_all_records()
        self.stats["after"] = final_counts

        # Calcular totais
        total_before = sum(c for c in self.stats["before"].values() if isinstance(c, int))
        total_after = sum(c for c in final_counts.values() if isinstance(c, int))
        total_deleted = sum(c for c in self.stats["deleted"].values() if isinstance(c, int))

        logger.info(f"📊 Resultado final:")
        logger.info(f"  Registros antes: {total_before}")
        logger.info(f"  Registros depois: {total_after}")
        logger.info(f"  Registros removidos: {total_deleted}")

        # Verificar se apenas usuários restaram
        non_user_records = total_after - final_counts.get('users', 0)
        if non_user_records == 0:
            logger.info("🎉 Limpeza perfeita! Apenas usuários foram preservados.")
            return True
        else:
            logger.warning(f"⚠️ Ainda restam {non_user_records} registros não-usuário")
            for table, count in final_counts.items():
                if table != 'users' and count > 0:
                    logger.warning(f"    {table}: {count}")
            return False

    def run_complete_cleanup(self):
        """Executa limpeza completa do sistema."""
        logger.info("=" * 60)
        logger.info("🧹 LIMPEZA COMPLETA DO SISTEMA INICIADA")
        logger.info("=" * 60)

        start_time = datetime.now()

        try:
            # 1. Contar registros iniciais
            logger.info("📊 Contando registros iniciais...")
            self.stats["before"] = self.count_all_records()
            total_initial = sum(c for c in self.stats["before"].values() if isinstance(c, int))
            logger.info(f"Total de registros encontrados: {total_initial}")

            # Mostrar contagem detalhada
            for table, count in self.stats["before"].items():
                if count > 0:
                    logger.info(f"  {table}: {count}")

            if total_initial == 0:
                logger.info("✅ Sistema já está limpo!")
                return True

            # 2. Analisar problemas
            self.analyze_problematic_cases()

            # 3. Limpar foreign keys
            self.cleanup_foreign_keys()

            # 4. Limpar todos os módulos
            self.cleanup_all_modules()

            # 5. Resetar sequências
            self.reset_sequences()

            # 6. Verificar resultado
            success = self.verify_cleanup()

            # 7. Estatísticas finais
            end_time = datetime.now()
            duration = end_time - start_time

            logger.info("=" * 60)
            logger.info("📈 ESTATÍSTICAS FINAIS")
            logger.info("=" * 60)
            logger.info(f"⏱️ Tempo de execução: {duration}")
            logger.info(f"🗑️ Sequências resetadas: {len(self.stats['sequences_reset'])}")
            logger.info(f"❌ Erros encontrados: {len(self.stats['errors'])}")

            if self.stats["errors"]:
                logger.warning("⚠️ Erros durante limpeza:")
                for error in self.stats["errors"]:
                    logger.warning(f"    {error}")

            if success:
                logger.info("🎉 LIMPEZA COMPLETA BEM-SUCEDIDA!")
                logger.info("✅ Sistema pronto para teste de importação manual")
            else:
                logger.warning("⚠️ Limpeza concluída com avisos")

            return success

        except Exception as e:
            logger.error(f"❌ Erro fatal durante limpeza: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Função principal."""
    logger.info("🚀 Iniciando limpeza completa do sistema...")

    try:
        with CompleteCleanup() as cleanup:
            success = cleanup.run_complete_cleanup()

            if success:
                logger.info("\n" + "=" * 60)
                logger.info("✅ SISTEMA LIMPO E PRONTO PARA TESTE")
                logger.info("=" * 60)
                logger.info("📋 Próximos passos:")
                logger.info("1. Faça upload manual do documento de teste")
                logger.info("2. Verifique se atendimentos foram gerados na esteira")
                logger.info("3. Confirme na aba 'Global' da esteira de atendimentos")
                logger.info("=" * 60)
                return True
            else:
                logger.error("❌ Limpeza não foi totalmente bem-sucedida")
                return False

    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)