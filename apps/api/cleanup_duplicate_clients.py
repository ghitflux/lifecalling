"""
Script de Limpeza de Clientes Duplicados
========================================

Consolida clientes duplicados mantendo apenas 1 registro por CPF.
Critério: mantém o registro mais recente (maior ID) e transfere todos os casos.
"""

import sys
import os
from sqlalchemy import text

# Adicionar o diretório pai ao path
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models import Client, Case

def cleanup_duplicate_clients(dry_run=True):
    """
    Consolida clientes duplicados mantendo apenas 1 por CPF.

    Args:
        dry_run: Se True, apenas mostra o que seria feito sem executar
    """
    db = SessionLocal()

    try:
        # Buscar CPFs com mais de 1 registro de cliente (SOMENTE por CPF, ignorando nome)
        query = text("""
            SELECT
                cpf,
                STRING_AGG(DISTINCT name, ' / ' ORDER BY name) as nomes,
                COUNT(*) as total_registros,
                STRING_AGG(CAST(id AS TEXT), ', ' ORDER BY id DESC) as client_ids_ordenados,
                STRING_AGG(matricula, ', ' ORDER BY id DESC) as matriculas,
                STRING_AGG(COALESCE(orgao, 'SEM ORGAO'), ', ' ORDER BY id DESC) as orgaos
            FROM clients
            GROUP BY cpf
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC;
        """)

        results = db.execute(query).fetchall()

        print(f"\n{'='*80}")
        print(f"LIMPEZA DE CLIENTES DUPLICADOS - {'DRY RUN' if dry_run else 'EXECUÇÃO REAL'}")
        print(f"{'='*80}\n")

        total_cpfs_duplicados = len(results)
        total_clientes_deletar = 0
        total_casos_transferidos = 0

        print(f"📊 CPFs com registros duplicados: {total_cpfs_duplicados}\n")

        for row in results:
            cpf = row[0]
            nomes = row[1]  # Pode ter múltiplos nomes separados por " / "
            total_registros = row[2]
            client_ids = [int(x.strip()) for x in row[3].split(',')]
            matriculas = row[4].split(', ')
            orgaos = row[5].split(', ')

            # O primeiro ID da lista é o mais recente (ORDER BY id DESC)
            cliente_manter = client_ids[0]
            clientes_deletar = client_ids[1:]

            print(f"CPF: {cpf}")
            if ' / ' in nomes:
                print(f"  ⚠️  Nomes diferentes: {nomes}")
            print(f"  Total de registros: {total_registros}")
            print(f"  Matrículas: {', '.join(matriculas)}")
            print(f"  Órgãos: {', '.join(orgaos)}")
            print(f"  ✅ MANTER cliente #{cliente_manter} (mais recente)")
            print(f"  ❌ DELETAR clientes: {', '.join([f'#{c}' for c in clientes_deletar])}")

            # Buscar casos vinculados aos clientes que serão deletados
            casos_a_transferir = db.query(Case).filter(
                Case.client_id.in_(clientes_deletar)
            ).all()

            if casos_a_transferir:
                print(f"  🔄 Transferir {len(casos_a_transferir)} casos:")
                for caso in casos_a_transferir:
                    print(f"     Caso #{caso.id}: de cliente #{caso.client_id} → #{cliente_manter}")

            total_clientes_deletar += len(clientes_deletar)
            total_casos_transferidos += len(casos_a_transferir)

            if not dry_run:
                # Transferir casos para o cliente mantido
                for caso in casos_a_transferir:
                    caso.client_id = cliente_manter
                    print(f"     ✅ Caso #{caso.id} transferido")

                db.flush()

                # Deletar clientes duplicados
                for client_id in clientes_deletar:
                    client = db.query(Client).get(client_id)
                    if client:
                        db.delete(client)
                        print(f"     🗑️  Cliente #{client_id} deletado")

                db.commit()
            print()

        print(f"\n{'='*80}")
        print(f"📈 RESUMO:")
        print(f"  - CPFs duplicados: {total_cpfs_duplicados}")
        print(f"  - Clientes a deletar: {total_clientes_deletar}")
        print(f"  - Clientes a manter: {total_cpfs_duplicados}")
        print(f"  - Casos a transferir: {total_casos_transferidos}")

        if dry_run:
            print(f"\n⚠️  DRY RUN - Nenhuma mudança foi aplicada")
            print(f"   Execute com dry_run=False para aplicar as mudanças")
        else:
            print(f"\n✅ Limpeza concluída com sucesso!")

        print(f"{'='*80}\n")

        return {
            "cpfs_duplicados": total_cpfs_duplicados,
            "clientes_deletados": total_clientes_deletar if not dry_run else 0,
            "clientes_mantidos": total_cpfs_duplicados,
            "casos_transferidos": total_casos_transferidos if not dry_run else 0
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Erro durante limpeza: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Limpeza de clientes duplicados')
    parser.add_argument('--execute', action='store_true',
                       help='Executar limpeza (sem isso, apenas mostra o que seria feito)')

    args = parser.parse_args()

    cleanup_duplicate_clients(dry_run=not args.execute)
