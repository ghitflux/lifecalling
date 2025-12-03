"""
Script de limpeza única para remover mensalidades antigas.
Mantém apenas a mensalidade mais recente de cada contrato do cliente.

IMPORTANTE: Este script deve ser executado UMA VEZ para limpar dados históricos.
Após a execução, o sistema manterá automaticamente apenas a mensalidade mais recente
através da função cleanup_old_references() em imports.py.

Uso:
    python cleanup_old_payroll_data.py [--dry-run]

Opções:
    --dry-run    Simula a operação sem executar a exclusão
"""

import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Importar configuração do banco
try:
    from app.config import settings
    DATABASE_URL = settings.db_uri
except ImportError:
    # Fallback: tentar ler do .env
    import os
    from dotenv import load_dotenv
    from pathlib import Path

    # Carregar .env do diretório correto
    env_file = Path(__file__).parent / ".env"
    env_root = Path(__file__).parent.parent.parent / ".env"

    if env_file.exists():
        load_dotenv(env_file)
    elif env_root.exists():
        load_dotenv(env_root)

    # Construir DATABASE_URL
    if os.getenv("DATABASE_URL"):
        DATABASE_URL = os.getenv("DATABASE_URL")
    else:
        postgres_user = os.getenv('POSTGRES_USER', 'lifecalling')
        postgres_password = os.getenv('POSTGRES_PASSWORD', 'lifecalling')
        postgres_host = os.getenv('POSTGRES_HOST', 'localhost')
        postgres_port = os.getenv('POSTGRES_PORT', '5432')
        postgres_db = os.getenv('POSTGRES_DB', 'lifecalling')
        DATABASE_URL = f"postgresql+psycopg2://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}?client_encoding=utf8"

if not DATABASE_URL:
    logger.error("DATABASE_URL não encontrado. Configure o banco de dados.")
    sys.exit(1)


def get_statistics(session):
    """Retorna estatísticas sobre as referências no banco."""
    # Total de linhas
    total_query = text("SELECT COUNT(*) FROM payroll_lines")
    total = session.execute(total_query).scalar()

    # Linhas a serem deletadas (rn > 1 - mantém apenas a mais recente)
    to_delete_query = text("""
        SELECT COUNT(*) FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY cpf, matricula, financiamento_code
                    ORDER BY ref_year DESC, ref_month DESC
                ) as rn
            FROM payroll_lines
        ) ranked
        WHERE rn > 1
    """)
    to_delete = session.execute(to_delete_query).scalar()

    # Distribuição por mês/ano
    distribution_query = text("""
        SELECT
            ref_year,
            ref_month,
            COUNT(*) as count
        FROM payroll_lines
        GROUP BY ref_year, ref_month
        ORDER BY ref_year DESC, ref_month DESC
    """)
    distribution = session.execute(distribution_query).fetchall()

    # Total de contratos únicos
    unique_contracts_query = text("""
        SELECT COUNT(DISTINCT (cpf, matricula, financiamento_code))
        FROM payroll_lines
    """)
    unique_contracts = session.execute(unique_contracts_query).scalar()

    return {
        "total": total,
        "to_delete": to_delete,
        "to_keep": total - to_delete,
        "distribution": distribution,
        "unique_contracts": unique_contracts
    }


def show_sample_deletions(session, limit=20):
    """Mostra exemplos de linhas que serão deletadas."""
    sample_query = text("""
        SELECT
            cpf,
            matricula,
            financiamento_code,
            ref_year,
            ref_month,
            rn
        FROM (
            SELECT
                cpf,
                matricula,
                financiamento_code,
                ref_year,
                ref_month,
                ROW_NUMBER() OVER (
                    PARTITION BY cpf, matricula, financiamento_code
                    ORDER BY ref_year DESC, ref_month DESC
                ) as rn
            FROM payroll_lines
        ) ranked
        WHERE rn > 1
        ORDER BY cpf, matricula, financiamento_code, rn
        LIMIT :limit
    """)
    samples = session.execute(sample_query, {"limit": limit}).fetchall()

    if samples:
        logger.info(f"\n{'='*80}")
        logger.info(f"Exemplos de linhas que serão deletadas (primeiras {limit}):")
        logger.info(f"{'='*80}")
        logger.info(f"{'CPF':<14} {'MATRÍCULA':<12} {'FIN':<8} {'REF':<8} {'RANK':<6}")
        logger.info(f"{'-'*80}")
        for row in samples:
            cpf, matricula, fin, year, month, rn = row
            ref = f"{month:02d}/{year}"
            logger.info(f"{cpf:<14} {matricula:<12} {fin:<8} {ref:<8} {rn:<6}")
        logger.info(f"{'='*80}\n")


def cleanup_old_payroll_data(session, dry_run=False):
    """
    Remove mensalidades antigas, mantendo apenas a mais recente de cada contrato.

    Args:
        session: Sessão do banco
        dry_run: Se True, apenas mostra o que seria deletado sem executar

    Returns:
        Número de linhas que seriam/foram deletadas
    """
    start_time = datetime.now()

    # Obter estatísticas antes
    logger.info("Analisando dados antes da limpeza...")
    stats_before = get_statistics(session)

    logger.info(f"\n{'='*80}")
    logger.info("ESTATÍSTICAS ANTES DA LIMPEZA")
    logger.info(f"{'='*80}")
    logger.info(f"Total de linhas no banco: {stats_before['total']:,}")
    logger.info(f"Total de contratos únicos: {stats_before['unique_contracts']:,}")
    logger.info(f"Linhas a deletar (antigas): {stats_before['to_delete']:,}")
    logger.info(f"Linhas a manter (mês mais recente): {stats_before['to_keep']:,}")
    logger.info(f"\nDistribuição por mês/ano:")
    for year, month, count in stats_before['distribution']:
        logger.info(f"  {month:02d}/{year}: {count:,} linhas")
    logger.info(f"{'='*80}\n")

    if stats_before['to_delete'] == 0:
        logger.info("✓ Nenhuma linha antiga para deletar. Banco já está limpo!")
        return 0

    # Mostrar exemplos
    show_sample_deletions(session)

    if dry_run:
        logger.info(f"{'='*80}")
        logger.info("DRY RUN: Nenhuma operação foi executada")
        logger.info(f"Total de linhas que SERIAM deletadas: {stats_before['to_delete']:,}")
        logger.info(f"Total de linhas que SERIAM mantidas: {stats_before['to_keep']:,}")
        logger.info(f"Economia de espaço estimada: ~{stats_before['to_delete'] * 0.5:.1f} KB")
        logger.info(f"{'='*80}")
        return stats_before['to_delete']

    # Executar deleção
    logger.info("Executando limpeza...")
    logger.info("⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!")

    delete_query = text("""
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY cpf, matricula, financiamento_code
                    ORDER BY ref_year DESC, ref_month DESC
                ) as rn
            FROM payroll_lines
        )
        DELETE FROM payroll_lines
        WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    """)

    result = session.execute(delete_query)
    deleted_count = result.rowcount
    session.commit()

    # Obter estatísticas depois
    stats_after = get_statistics(session)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    logger.info(f"\n{'='*80}")
    logger.info("ESTATÍSTICAS APÓS A LIMPEZA")
    logger.info(f"{'='*80}")
    logger.info(f"Total de linhas deletadas: {deleted_count:,}")
    logger.info(f"Total de linhas no banco: {stats_after['total']:,}")
    logger.info(f"Total de contratos únicos: {stats_after['unique_contracts']:,}")
    logger.info(f"Tempo de execução: {duration:.2f} segundos")
    logger.info(f"\nDistribuição por mês/ano (após limpeza):")
    for year, month, count in stats_after['distribution']:
        logger.info(f"  {month:02d}/{year}: {count:,} linhas")
    logger.info(f"{'='*80}\n")

    return deleted_count


def main():
    """Função principal."""
    parser = argparse.ArgumentParser(
        description="Limpa mensalidades antigas, mantendo apenas o mês mais recente de cada contrato."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mostra o que seria deletado sem executar a operação"
    )
    args = parser.parse_args()

    # Criar engine e sessão
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        logger.info("="*80)
        logger.info("SCRIPT DE LIMPEZA DE MENSALIDADES ANTIGAS")
        logger.info("="*80)
        logger.info(f"Modo: {'DRY RUN (simulação)' if args.dry_run else 'EXECUÇÃO REAL'}")
        logger.info(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        logger.info("="*80 + "\n")

        if not args.dry_run:
            logger.warning("⚠️  ATENÇÃO: Você está prestes a executar uma limpeza REAL!")
            logger.warning("⚠️  Esta operação é IRREVERSÍVEL!")
            logger.warning("⚠️  Recomenda-se executar primeiro com --dry-run para verificar o que será deletado.\n")

            response = input("Digite 'CONFIRMO' para continuar: ")
            if response != "CONFIRMO":
                logger.info("Operação cancelada pelo usuário.")
                return 0

        deleted_count = cleanup_old_payroll_data(session, dry_run=args.dry_run)

        if args.dry_run:
            logger.info(f"\n✓ DRY RUN concluído: {deleted_count:,} linhas seriam deletadas")
            logger.info("  Execute sem --dry-run para executar a limpeza real")
        else:
            logger.info(f"\n✓ Limpeza concluída com sucesso: {deleted_count:,} linhas antigas removidas")
            logger.info("  O sistema agora manterá automaticamente apenas a mensalidade mais recente")

    except KeyboardInterrupt:
        logger.warning("\n\n⚠️  Operação interrompida pelo usuário")
        session.rollback()
        return 1
    except Exception as e:
        logger.error(f"\n✗ Erro durante a limpeza: {e}")
        session.rollback()
        return 1
    finally:
        session.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
