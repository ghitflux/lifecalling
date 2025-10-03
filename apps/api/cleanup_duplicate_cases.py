"""
Script de Limpeza de Casos Duplicados
======================================

Remove casos duplicados mantendo apenas 1 caso ativo por CPF.
Critério: mantém o caso mais recente (created_at mais novo)
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models import Case, Client

def cleanup_duplicate_cases(dry_run=True):
    """
    Remove casos duplicados mantendo apenas 1 caso por CPF.

    Args:
        dry_run: Se True, apenas mostra o que seria deletado sem executar
    """
    db = SessionLocal()

    try:
        # Buscar CPFs com mais de 1 caso
        query = text("""
            SELECT
                cl.cpf,
                cl.name,
                COUNT(c.id) as total_casos,
                STRING_AGG(CAST(c.id AS TEXT), ', ' ORDER BY c.created_at DESC) as case_ids_ordenados,
                STRING_AGG(CAST(cl.matricula AS TEXT), ', ' ORDER BY c.created_at DESC) as matriculas
            FROM cases c
            JOIN clients cl ON c.client_id = cl.id
            GROUP BY cl.cpf, cl.name
            HAVING COUNT(c.id) > 1
            ORDER BY COUNT(c.id) DESC;
        """)

        results = db.execute(query).fetchall()

        print(f"\n{'='*80}")
        print(f"LIMPEZA DE CASOS DUPLICADOS - {'DRY RUN' if dry_run else 'EXECUÇÃO REAL'}")
        print(f"{'='*80}\n")

        total_cpfs_duplicados = len(results)
        total_casos_deletar = 0

        print(f"📊 CPFs com casos duplicados: {total_cpfs_duplicados}\n")

        for row in results:
            cpf = row[0]
            nome = row[1]
            total_casos = row[2]
            case_ids = [int(x.strip()) for x in row[3].split(',')]
            matriculas = row[4].split(', ')

            # O primeiro ID da lista é o mais recente (ORDER BY created_at DESC)
            caso_manter = case_ids[0]
            casos_deletar = case_ids[1:]

            print(f"CPF: {cpf} - {nome}")
            print(f"  Total de casos: {total_casos}")
            print(f"  Matrículas: {', '.join(matriculas)}")
            print(f"  ✅ MANTER caso #{caso_manter} (mais recente)")
            print(f"  ❌ DELETAR casos: {', '.join([f'#{c}' for c in casos_deletar])}")

            total_casos_deletar += len(casos_deletar)

            if not dry_run:
                # Deletar casos duplicados
                for case_id in casos_deletar:
                    case = db.query(Case).get(case_id)
                    if case:
                        db.delete(case)
                        print(f"     🗑️  Deletado caso #{case_id}")

                db.commit()
            print()

        print(f"\n{'='*80}")
        print(f"📈 RESUMO:")
        print(f"  - CPFs com duplicatas: {total_cpfs_duplicados}")
        print(f"  - Casos a deletar: {total_casos_deletar}")
        print(f"  - Casos a manter: {total_cpfs_duplicados}")

        if dry_run:
            print(f"\n⚠️  DRY RUN - Nenhuma mudança foi aplicada")
            print(f"   Execute com dry_run=False para aplicar as mudanças")
        else:
            print(f"\n✅ Limpeza concluída com sucesso!")

        print(f"{'='*80}\n")

        return {
            "cpfs_duplicados": total_cpfs_duplicados,
            "casos_deletados": total_casos_deletar if not dry_run else 0,
            "casos_mantidos": total_cpfs_duplicados
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante limpeza: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Limpeza de casos duplicados')
    parser.add_argument('--execute', action='store_true',
                       help='Executar limpeza (sem isso, apenas mostra o que seria deletado)')

    args = parser.parse_args()

    cleanup_duplicate_cases(dry_run=not args.execute)
