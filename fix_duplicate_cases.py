"""
Script para corrigir casos duplicados no banco de dados.

REGRA: 1 CPF = 1 Cliente = 1 Caso Ativo

Para casos duplicados:
- Mantém o caso com contrato efetivado (prioritário)
- Se não houver contrato, mantém o caso mais antigo
- Arquiva os demais casos duplicados
"""

import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Usar banco local para testes
DATABASE_URL = "postgresql://lifecalling:lifecalling@localhost:5433/lifecalling"

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def find_duplicate_cases(session):
    """Encontra CPFs com múltiplos casos ativos."""
    query = text("""
        SELECT
            c.cpf,
            COUNT(DISTINCT cs.id) as total_casos,
            STRING_AGG(cs.id::text, ',' ORDER BY cs.id) as case_ids,
            STRING_AGG(cs.status, ',' ORDER BY cs.id) as status_list,
            STRING_AGG(COALESCE(ct.id::text, 'NULL'), ',' ORDER BY cs.id) as contract_ids
        FROM clients c
        JOIN cases cs ON cs.client_id = c.id
        LEFT JOIN contracts ct ON ct.case_id = cs.id
        WHERE cs.status IN ('novo', 'disponivel', 'em_atendimento', 'calculista',
                            'calculista_pendente', 'financeiro', 'fechamento_pendente',
                            'calculo_aprovado', 'fechamento_aprovado', 'contrato_efetivado')
        GROUP BY c.cpf
        HAVING COUNT(DISTINCT cs.id) > 1
        ORDER BY total_casos DESC
    """)

    result = session.execute(query)
    return result.fetchall()

def get_case_details(session, cpf):
    """Busca detalhes de todos os casos de um CPF."""
    query = text("""
        SELECT
            cs.id as case_id,
            cs.status,
            cs.created_at,
            ct.id as contract_id,
            ct.signed_at,
            c.id as client_id,
            c.name as client_name
        FROM clients c
        JOIN cases cs ON cs.client_id = c.id
        LEFT JOIN contracts ct ON ct.case_id = cs.id
        WHERE c.cpf = :cpf
          AND cs.status IN ('novo', 'disponivel', 'em_atendimento', 'calculista',
                            'calculista_pendente', 'financeiro', 'fechamento_pendente',
                            'calculo_aprovado', 'fechamento_aprovado', 'contrato_efetivado')
        ORDER BY
            CASE WHEN cs.status = 'contrato_efetivado' THEN 0 ELSE 1 END,
            cs.created_at ASC
    """)

    result = session.execute(query, {"cpf": cpf})
    return result.fetchall()

def archive_case(session, case_id, reason):
    """Arquiva um caso duplicado."""
    query = text("""
        UPDATE cases
        SET
            status = 'arquivado',
            last_update_at = NOW(),
            assigned_user_id = NULL,
            assigned_at = NULL,
            assignment_expires_at = NULL
        WHERE id = :case_id
    """)

    session.execute(query, {"case_id": case_id})

    # Criar evento de arquivamento
    event_query = text("""
        INSERT INTO case_events (case_id, type, payload, created_at)
        VALUES (:case_id, 'case.archived', :payload, NOW())
    """)

    session.execute(event_query, {
        "case_id": case_id,
        "payload": f'{{"reason": "{reason}", "automated": true}}'
    })

    logger.info(f"  ✓ Caso {case_id} arquivado: {reason}")

def fix_duplicates(dry_run=True):
    """
    Corrige casos duplicados.

    Args:
        dry_run: Se True, apenas simula as mudanças sem aplicar
    """
    session = Session()

    try:
        logger.info("=" * 80)
        logger.info("SCRIPT DE CORREÇÃO DE CASOS DUPLICADOS")
        logger.info("=" * 80)
        logger.info(f"Modo: {'DRY RUN (simulação)' if dry_run else 'EXECUÇÃO REAL'}")
        logger.info("")

        # Buscar duplicatas
        duplicates = find_duplicate_cases(session)

        if not duplicates:
            logger.info("✓ Nenhum caso duplicado encontrado!")
            return

        logger.info(f"Encontrados {len(duplicates)} CPFs com casos duplicados")
        logger.info("")

        stats = {
            "cpfs_processados": 0,
            "casos_mantidos": 0,
            "casos_arquivados": 0
        }

        for row in duplicates:
            cpf = row[0]
            total_casos = row[1]

            logger.info(f"CPF: {cpf} ({total_casos} casos ativos)")

            # Buscar detalhes dos casos
            cases = get_case_details(session, cpf)

            # Primeiro caso da lista é o prioritário (já ordenado pela query)
            # Prioridade: contrato_efetivado > mais antigo
            keep_case = cases[0]
            archive_cases = cases[1:]

            logger.info(f"  → MANTER: Caso {keep_case[0]} (status: {keep_case[1]}, " +
                       f"criado: {keep_case[2]}, contrato: {keep_case[3] or 'sem'})")

            for case in archive_cases:
                case_id = case[0]
                status = case[1]
                contract_id = case[3]

                reason = f"Duplicata removida - CPF já possui caso {keep_case[0]}"

                if contract_id:
                    logger.warning(f"  ⚠ ATENÇÃO: Caso {case_id} tem contrato {contract_id}!")
                    reason = f"DUPLICATA COM CONTRATO - Verificar manualmente"

                logger.info(f"  → ARQUIVAR: Caso {case_id} (status: {status})")

                if not dry_run:
                    archive_case(session, case_id, reason)
                    stats["casos_arquivados"] += 1

            stats["cpfs_processados"] += 1
            stats["casos_mantidos"] += 1
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
        logger.info(f"  CPFs processados: {stats['cpfs_processados']}")
        logger.info(f"  Casos mantidos: {stats['casos_mantidos']}")
        logger.info(f"  Casos arquivados: {stats['casos_arquivados']}")
        logger.info("=" * 80)

    except Exception as e:
        session.rollback()
        logger.error(f"Erro: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Corrige casos duplicados")
    parser.add_argument("--execute", action="store_true",
                       help="Executa as mudanças (padrão é dry-run)")

    args = parser.parse_args()

    if args.execute:
        confirm = input("CONFIRMA EXECUCAO REAL? (digite 'SIM' para confirmar): ")
        if confirm != "SIM":
            print("Operacao cancelada")
            sys.exit(0)

    fix_duplicates(dry_run=not args.execute)
