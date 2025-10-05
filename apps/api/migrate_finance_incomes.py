#!/usr/bin/env python
"""
Script para adicionar a coluna agent_user_id na tabela finance_incomes
"""

import sys
from pathlib import Path

# Adicionar o diretório app ao path
sys.path.insert(0, str(Path(__file__).parent))

from app.db import engine
from sqlalchemy import text

def migrate():
    print("[INFO] Iniciando migracao da tabela finance_incomes...")

    with engine.connect() as conn:
        # Verificar se a coluna já existe
        result = conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'finance_incomes'
            AND column_name = 'agent_user_id'
        """))

        if result.fetchone():
            print("[OK] Coluna agent_user_id ja existe!")
            return

        # Adicionar a coluna
        print("[INFO] Adicionando coluna agent_user_id...")
        conn.execute(text("""
            ALTER TABLE finance_incomes
            ADD COLUMN agent_user_id INTEGER REFERENCES users(id)
        """))
        conn.commit()

        print("[OK] Coluna agent_user_id adicionada com sucesso!")

        # Verificar estrutura da tabela
        print("\n[INFO] Estrutura atual da tabela finance_incomes:")
        result = conn.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'finance_incomes'
            ORDER BY ordinal_position
        """))

        for row in result:
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  - {row[0]}: {row[1]} ({nullable})")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"[ERROR] Erro durante migracao: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
