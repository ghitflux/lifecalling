#!/usr/bin/env python3
"""
Script para investigar problemas nos dados do banco
"""
import os
import sys

# Configurar variáveis de ambiente baseadas no .env
os.environ['POSTGRES_HOST'] = 'localhost'  # Usar localhost quando executar fora do Docker
os.environ['POSTGRES_PORT'] = '5432'
os.environ['POSTGRES_DB'] = 'lifecalling'
os.environ['POSTGRES_USER'] = 'lifecalling'
os.environ['POSTGRES_PASSWORD'] = 'lifecalling'

sys.path.append('apps/api')

from app.db import SessionLocal
from app.models import Case, Client
from sqlalchemy import text

def investigate_data_issues():
    """Investiga problemas nos dados"""
    print("🔍 Investigando problemas nos dados...")

    with SessionLocal() as db:
        # 1. Verificar casos sem cliente
        casos_sem_cliente = db.query(Case).filter(Case.client_id.is_(None)).count()
        print(f"❌ Casos sem client_id: {casos_sem_cliente}")

        # 2. Verificar casos com client_id inválido
        query = """
        SELECT COUNT(*)
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.client_id IS NOT NULL AND cl.id IS NULL
        """
        casos_cliente_invalido = db.execute(text(query)).scalar()
        print(f"❌ Casos com client_id inválido: {casos_cliente_invalido}")

        # 3. Verificar clientes sem dados essenciais
        clientes_sem_nome = db.query(Client).filter(Client.name.is_(None)).count()
        print(f"❌ Clientes sem nome: {clientes_sem_nome}")

        # 4. Mostrar alguns casos problemáticos
        query_problematicos = """
        SELECT c.id, c.client_id, cl.name, c.status
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.client_id IS NOT NULL AND cl.id IS NULL
        LIMIT 10
        """
        casos_problematicos = db.execute(text(query_problematicos)).fetchall()
        print(f"\n🚨 Casos problemáticos (primeiros 10):")
        for caso in casos_problematicos:
            print(f"  - Caso ID: {caso[0]}, client_id: {caso[1]}, nome: {caso[2]}, status: {caso[3]}")

        # 5. Verificar distribuição de status
        query_status = """
        SELECT status, COUNT(*) as count
        FROM cases
        GROUP BY status
        ORDER BY count DESC
        """
        status_distribution = db.execute(text(query_status)).fetchall()
        print("\n📊 Distribuição de status:")
        for status, count in status_distribution:
            print(f"  - {status}: {count} casos")

        # 6. Verificar casos que causam erro na API
        print(f"\n🔍 Verificando casos que podem causar erro na API...")

        # Casos sem last_update_at
        casos_sem_update = db.query(Case).filter(Case.last_update_at.is_(None)).count()
        print(f"  - Casos sem last_update_at: {casos_sem_update}")

        # Verificar casos com status problemático
        casos_com_status_erro = db.query(Case).filter(Case.status == "erro").count()
        print(f"  - Casos com status 'erro': {casos_com_status_erro}")

        # Verificar casos sem assigned_user_id quando status indica atribuição
        casos_atribuidos_sem_user = db.query(Case).filter(
            Case.status.in_(["atribuido", "em_atendimento"]),
            Case.assigned_user_id.is_(None)
        ).count()
        print(f"  - Casos atribuídos sem usuário: {casos_atribuidos_sem_user}")

        # Total de casos
        total_casos = db.query(Case).count()
        print(f"\n📈 Total de casos no banco: {total_casos}")

if __name__ == "__main__":
    investigate_data_issues()
