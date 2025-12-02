"""
Script para popular o campo cargo dos clientes com base nos dados de PayrollLine.
"""
import os
import sys

# Adicionar o diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Criar conexão com o banco usando a configuração existente
engine = create_engine(settings.db_uri)
SessionLocal = sessionmaker(bind=engine)

def populate_cargos():
    """
    Atualiza o campo cargo dos clientes com base no cargo mais recente
    encontrado em payroll_lines para cada CPF.
    """
    db = SessionLocal()
    try:
        print("Iniciando atualizacao de cargos dos clientes...")

        # Query SQL para atualizar cargos dos clientes
        # Pega o cargo mais recente (maior ref_year, ref_month) de cada CPF
        sql = text("""
            WITH latest_cargos AS (
                SELECT DISTINCT ON (cpf)
                    cpf,
                    cargo
                FROM payroll_lines
                WHERE cargo IS NOT NULL
                  AND cargo != ''
                ORDER BY cpf, ref_year DESC, ref_month DESC
            )
            UPDATE clients
            SET cargo = latest_cargos.cargo
            FROM latest_cargos
            WHERE clients.cpf = latest_cargos.cpf
              AND (clients.cargo IS NULL OR clients.cargo = '')
        """)

        result = db.execute(sql)
        db.commit()

        updated_count = result.rowcount
        print(f"[OK] {updated_count} clientes atualizados com sucesso!")

        # Mostrar estatísticas
        stats_sql = text("""
            SELECT
                COUNT(*) FILTER (WHERE cargo IS NOT NULL AND cargo != '') as com_cargo,
                COUNT(*) FILTER (WHERE cargo IS NULL OR cargo = '') as sem_cargo,
                COUNT(*) as total
            FROM clients
        """)

        stats = db.execute(stats_sql).fetchone()
        print(f"\nEstatisticas:")
        print(f"   - Total de clientes: {stats.total}")
        print(f"   - Com cargo: {stats.com_cargo}")
        print(f"   - Sem cargo: {stats.sem_cargo}")

        # Mostrar os 10 cargos mais comuns
        top_cargos_sql = text("""
            SELECT cargo, COUNT(*) as count
            FROM clients
            WHERE cargo IS NOT NULL AND cargo != ''
            GROUP BY cargo
            ORDER BY count DESC
            LIMIT 10
        """)

        top_cargos = db.execute(top_cargos_sql).fetchall()
        print(f"\nTop 10 cargos mais comuns:")
        for cargo, count in top_cargos:
            print(f"   - {cargo}: {count} clientes")

    except Exception as e:
        print(f"[ERRO] Erro ao atualizar cargos: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    populate_cargos()
