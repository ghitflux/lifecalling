#!/usr/bin/env python3
"""
Migração para adicionar campo filename à tabela attachments
"""

import os
import sys
from sqlalchemy import text

# Adicionar o diretório da aplicação ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.db import SessionLocal

def migrate():
    """Executa a migração"""
    with SessionLocal() as db:
        try:
            # Adicionar a coluna filename
            print("Adicionando coluna filename à tabela attachments...")
            db.execute(text("ALTER TABLE attachments ADD COLUMN filename VARCHAR(255)"))
            
            # Atualizar registros existentes com o nome extraído do path
            print("Atualizando registros existentes...")
            result = db.execute(text("""
                UPDATE attachments 
                SET filename = CASE 
                    WHEN path LIKE '%/%' THEN SUBSTRING(path FROM '[^/]*$')
                    WHEN path LIKE '%\\%' THEN SUBSTRING(path FROM '[^\\]*$')
                    ELSE path
                END
                WHERE filename IS NULL
            """))
            
            print(f"Atualizados {result.rowcount} registros")
            
            # Tornar a coluna NOT NULL após atualizar os dados
            print("Tornando coluna filename obrigatória...")
            db.execute(text("ALTER TABLE attachments ALTER COLUMN filename SET NOT NULL"))
            
            db.commit()
            print("Migração concluída com sucesso!")
            
        except Exception as e:
            print(f"Erro na migração: {e}")
            db.rollback()
            raise

if __name__ == "__main__":
    migrate()