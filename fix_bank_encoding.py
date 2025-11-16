"""
Script para corrigir encoding de nomes de bancos/entidades no banco de dados.

Corrige caracteres UTF-8 corrompidos (ex: Ê → �) em:
- payroll_lines.entity_name
- import_batches.entity_name
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Usar DATABASE_URL de ambiente ou fallback para local
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://lifecalling:lifecalling@localhost:5433/lifecalling")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# Mapeamento de nomes corrompidos para nomes corretos
CORRECTIONS = {
    "FUTURO PREVID�NCIA PRIVADA": "FUTURO PREVIDÊNCIA PRIVADA",
    "FUTURO PREVIDÊNCIA PRIVADA": "FUTURO PREVIDÊNCIA PRIVADA",  # Caso já esteja correto
    "Assoc. Benef. e Assist. dos Serv. P�blicos - ABASE": "Assoc. Benef. e Assist. dos Serv. Públicos - ABASE",
    "Assoc. Benef. e Assist. dos Serv. Públicos - ABASE": "Assoc. Benef. e Assist. dos Serv. Públicos - ABASE",
}

def find_corrupted_names(session):
    """Busca nomes de entidades com encoding corrompido (caractere �)."""
    query = text("""
        SELECT DISTINCT entity_name
        FROM payroll_lines
        WHERE entity_name LIKE '%�%'
        ORDER BY entity_name
    """)

    result = session.execute(query)
    return [row[0] for row in result.fetchall()]

def count_affected_records(session, old_name, table):
    """Conta quantos registros serão afetados."""
    query = text(f"""
        SELECT COUNT(*)
        FROM {table}
        WHERE entity_name = :old_name
    """)

    result = session.execute(query, {"old_name": old_name})
    return result.scalar()

def fix_encoding(dry_run=True):
    """
    Corrige encoding de nomes de entidades.

    Args:
        dry_run: Se True, apenas simula as mudanças sem aplicar
    """
    session = Session()

    try:
        logger.info("=" * 80)
        logger.info("SCRIPT DE CORREÇÃO DE ENCODING DE BANCOS/ENTIDADES")
        logger.info("=" * 80)
        logger.info(f"Modo: {'DRY RUN (simulação)' if dry_run else 'EXECUÇÃO REAL'}")
        logger.info("")

        # Buscar nomes corrompidos
        corrupted_names = find_corrupted_names(session)

        if not corrupted_names:
            logger.info("✓ Nenhum nome corrompido encontrado!")
            return

        logger.info(f"Encontrados {len(corrupted_names)} nomes com encoding corrompido:")
        for name in corrupted_names:
            logger.info(f"  - {name}")
        logger.info("")

        stats = {
            "payroll_lines_updated": 0,
            "import_batches_updated": 0,
            "names_corrected": 0
        }

        # Aplicar correções
        for old_name in corrupted_names:
            # Buscar correção no mapeamento
            new_name = CORRECTIONS.get(old_name)

            if not new_name:
                logger.warning(f"⚠ Correção não definida para: {old_name}")
                logger.warning(f"  Adicione ao dicionário CORRECTIONS no script")
                continue

            # Contar registros afetados
            payroll_count = count_affected_records(session, old_name, "payroll_lines")
            batch_count = count_affected_records(session, old_name, "import_batches")

            logger.info(f"Corrigindo: {old_name}")
            logger.info(f"  → Novo nome: {new_name}")
            logger.info(f"  → PayrollLines afetadas: {payroll_count}")
            logger.info(f"  → ImportBatches afetados: {batch_count}")

            if not dry_run:
                # Atualizar payroll_lines
                if payroll_count > 0:
                    query = text("""
                        UPDATE payroll_lines
                        SET entity_name = :new_name
                        WHERE entity_name = :old_name
                    """)
                    session.execute(query, {"old_name": old_name, "new_name": new_name})
                    stats["payroll_lines_updated"] += payroll_count

                # Atualizar import_batches
                if batch_count > 0:
                    query = text("""
                        UPDATE import_batches
                        SET entity_name = :new_name
                        WHERE entity_name = :old_name
                    """)
                    session.execute(query, {"old_name": old_name, "new_name": new_name})
                    stats["import_batches_updated"] += batch_count

                stats["names_corrected"] += 1
                logger.info(f"  ✓ Corrigido!")

            logger.info("")

        if not dry_run:
            session.commit()
            logger.info("=" * 80)
            logger.info("MUDANÇAS APLICADAS COM SUCESSO!")
        else:
            session.rollback()
            logger.info("=" * 80)
            logger.info("SIMULAÇÃO CONCLUÍDA (nenhuma mudança aplicada)")

        logger.info("=" * 80)
        logger.info("ESTATÍSTICAS:")
        logger.info(f"  Nomes corrigidos: {stats['names_corrected']}")
        logger.info(f"  PayrollLines atualizadas: {stats['payroll_lines_updated']}")
        logger.info(f"  ImportBatches atualizados: {stats['import_batches_updated']}")
        logger.info("=" * 80)

    except Exception as e:
        session.rollback()
        logger.error(f"Erro: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Corrige encoding de nomes de bancos")
    parser.add_argument("--execute", action="store_true",
                       help="Executa as mudanças (padrão é dry-run)")

    args = parser.parse_args()

    if args.execute:
        confirm = input("CONFIRMA EXECUCAO REAL? (digite 'SIM' para confirmar): ")
        if confirm != "SIM":
            print("Operacao cancelada")
            sys.exit(0)

    fix_encoding(dry_run=not args.execute)
