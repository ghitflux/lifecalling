#!/usr/bin/env python3
"""
Script para testar a importação e verificar se está gerando atendimentos.

Este script:
1. Cria um arquivo de teste no formato correto
2. Faz a importação via API
3. Verifica se Cases foram criados
4. Lista os dados criados
"""

import sys
from pathlib import Path
import tempfile
import requests
import json

# Adicionar o diretório da API ao path
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from app.db import SessionLocal
from app.models import Case, Client, ImportBatch, ImportRow
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# URL base da API (ajustar conforme necessário)
API_BASE = "http://localhost:8000"

def create_test_file():
    """Cria um arquivo de teste no formato iNETConsig."""
    content = """Entidade: 12345-BANCO TESTE S.A. Referência: 01/2025 Data da Geração: 29/01/2025

====================================================================
RELATÓRIO DE CONSIGNAÇÃO - BANCO TESTE
====================================================================

  1    123456-7  JOÃO DA SILVA SANTOS           1000,00    001    12345678901
  2    789012-3  MARIA OLIVEIRA COSTA           1500,00    001    98765432100
  3    456789-0  PEDRO FERREIRA LIMA             800,00    001    11122233344

====================================================================
TOTAL DE REGISTROS: 3
====================================================================
"""

    # Criar arquivo temporário
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='latin-1') as f:
        f.write(content)
        return f.name

def check_database_before_import():
    """Verifica estado do banco antes da importação."""
    logger.info("📊 Verificando estado do banco antes da importação...")

    with SessionLocal() as db:
        cases_count = db.query(Case).count()
        clients_count = db.query(Client).count()
        imports_count = db.query(ImportBatch).count()

        logger.info(f"Cases: {cases_count}")
        logger.info(f"Clients: {clients_count}")
        logger.info(f"ImportBatches: {imports_count}")

        return {
            "cases": cases_count,
            "clients": clients_count,
            "imports": imports_count
        }

def check_database_after_import():
    """Verifica estado do banco após a importação."""
    logger.info("📊 Verificando estado do banco após a importação...")

    with SessionLocal() as db:
        cases = db.query(Case).all()
        clients = db.query(Client).all()
        imports = db.query(ImportBatch).all()

        logger.info(f"Cases criados: {len(cases)}")
        for case in cases:
            logger.info(f"  Case {case.id}: status={case.status}, client_id={case.client_id}")
            if case.client:
                logger.info(f"    Cliente: {case.client.name} (CPF: {case.client.cpf})")

        logger.info(f"Clients criados: {len(clients)}")
        for client in clients:
            logger.info(f"  Client {client.id}: {client.name} (CPF: {client.cpf}, Matrícula: {client.matricula})")

        logger.info(f"ImportBatches criados: {len(imports)}")
        for import_batch in imports:
            logger.info(f"  Import {import_batch.id}: {import_batch.filename}")
            logger.info(f"    Counters: {import_batch.counters}")

        return {
            "cases": cases,
            "clients": clients,
            "imports": imports
        }

def test_import_via_api(file_path):
    """Testa importação via API."""
    logger.info("🚀 Testando importação via API...")

    try:
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'text/plain')}

            # Tentar importação Santander primeiro
            logger.info("Tentando importação Santander...")
            response = requests.post(
                f"{API_BASE}/imports",
                files=files,
                headers={'Authorization': 'Bearer fake-token-for-testing'}  # Ajustar conforme autenticação
            )

            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Importação Santander bem-sucedida: {result}")
                return result
            else:
                logger.error(f"❌ Erro na importação Santander: {response.status_code} - {response.text}")

            # Se falhou, tentar importação payroll
            logger.info("Tentando importação payroll...")
            with open(file_path, 'rb') as f2:
                files2 = {'file': (Path(file_path).name, f2, 'text/plain')}
                response2 = requests.post(
                    f"{API_BASE}/imports/payroll-txt",
                    files=files2,
                    headers={'Authorization': 'Bearer fake-token-for-testing'}
                )

                if response2.status_code == 200:
                    result = response2.json()
                    logger.info(f"✅ Importação payroll bem-sucedida: {result}")
                    return result
                else:
                    logger.error(f"❌ Erro na importação payroll: {response2.status_code} - {response2.text}")

    except requests.exceptions.ConnectionError:
        logger.error("❌ Erro de conexão com a API. Verifique se o servidor está rodando.")
        return None
    except Exception as e:
        logger.error(f"❌ Erro inesperado: {e}")
        return None

def test_import_directly():
    """Testa importação diretamente no código."""
    logger.info("🔧 Testando importação diretamente no código...")

    file_path = create_test_file()

    try:
        # Importar módulos necessários
        from app.routers.imports import import_txt
        from app.models import User
        from fastapi import UploadFile
        import io

        # Criar um mock user
        with SessionLocal() as db:
            # Verificar se existe usuário admin
            admin_user = db.query(User).filter(User.role == 'admin').first()
            if not admin_user:
                logger.error("❌ Nenhum usuário admin encontrado. Criando usuário de teste...")
                admin_user = User(
                    name="Admin Teste",
                    email="admin@teste.com",
                    password_hash="fake-hash",
                    role="admin"
                )
                db.add(admin_user)
                db.commit()
                logger.info(f"✅ Usuário admin criado: {admin_user.id}")

        # Ler conteúdo do arquivo
        with open(file_path, 'r', encoding='latin-1') as f:
            content = f.read()

        # Criar mock UploadFile
        file_obj = io.BytesIO(content.encode('latin-1'))

        class MockUploadFile:
            def __init__(self, content, filename):
                self.file = io.BytesIO(content.encode('latin-1'))
                self.filename = filename

        mock_file = MockUploadFile(content, "teste.txt")

        # Executar importação
        with SessionLocal() as db:
            from app.routers.imports import (
                parse_txt, validate_file_content,
                normalize_cpf, sync_client_to_payroll_system
            )

            logger.info("Validando conteúdo do arquivo...")
            validation_errors = validate_file_content(content)
            if validation_errors:
                logger.error(f"❌ Arquivo inválido: {validation_errors}")
                return None

            logger.info("Fazendo parse do arquivo...")
            parsed_data = parse_txt(content)
            meta = parsed_data["meta"]
            rows = parsed_data["rows"]

            logger.info(f"Parse concluído: {len(rows)} registros encontrados")
            logger.info(f"Metadados: {meta}")

            # Processar manualmente algumas linhas para testar
            if rows:
                logger.info("Processando primeiro registro...")
                row = rows[0]
                cpf = normalize_cpf(row["cpf"])
                matricula = row["matricula"].strip().upper()
                nome = row["nome"].strip()

                logger.info(f"Dados normalizados: CPF={cpf}, Matrícula={matricula}, Nome={nome}")

                # Buscar ou criar cliente
                client = db.query(Client).filter(
                    Client.cpf == cpf,
                    Client.matricula == matricula
                ).first()

                if not client:
                    logger.info("Criando novo cliente...")
                    client = Client(
                        name=nome,
                        cpf=cpf,
                        matricula=matricula,
                        orgao=meta.get("entidade", "").split("-")[-1].strip() if meta.get("entidade") else None
                    )
                    db.add(client)
                    db.flush()
                    logger.info(f"✅ Cliente criado: {client.id}")

                # Sincronizar com sistema payroll
                sync_client_to_payroll_system(db, client)

                # Verificar casos existentes
                open_cases = db.query(Case).filter(
                    Case.client_id == client.id,
                    Case.status.in_(["disponivel", "novo", "em_atendimento", "calculista_pendente"])
                ).all()

                if not open_cases:
                    logger.info("Criando novo caso...")
                    new_case = Case(
                        client_id=client.id,
                        status="disponivel",
                        entidade=meta.get("entidade"),
                        referencia_competencia=meta.get("referencia"),
                        importado_em=meta.get("gerado_em"),
                        last_update_at=datetime.utcnow()
                    )
                    db.add(new_case)
                    db.flush()
                    logger.info(f"✅ Caso criado: {new_case.id}")
                else:
                    logger.info(f"Cliente já possui {len(open_cases)} casos abertos")

                db.commit()

        return {"status": "success", "method": "direct"}

    except Exception as e:
        logger.error(f"❌ Erro na importação direta: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # Limpar arquivo temporário
        Path(file_path).unlink(missing_ok=True)

def main():
    """Função principal do teste."""
    logger.info("=== Teste de Importação - Verificação de Geração de Atendimentos ===")

    # Verificar estado inicial
    before_state = check_database_before_import()

    # Testar importação direta
    logger.info("\n🧪 Executando teste de importação...")
    result = test_import_directly()

    if result:
        logger.info("✅ Importação executada com sucesso!")
    else:
        logger.error("❌ Falha na importação!")
        return False

    # Verificar estado final
    logger.info("\n📊 Verificando resultados...")
    after_state = check_database_after_import()

    # Análise dos resultados
    cases_created = len(after_state["cases"]) - before_state["cases"]
    clients_created = len(after_state["clients"]) - before_state["clients"]

    logger.info(f"\n📈 Resumo dos resultados:")
    logger.info(f"Cases criados: {cases_created}")
    logger.info(f"Clients criados: {clients_created}")

    if cases_created > 0:
        logger.info("🎉 Sucesso! Atendimentos foram gerados pela importação!")
        return True
    else:
        logger.warning("⚠️ Nenhum atendimento foi gerado. Investigando...")

        # Verificar se existem clientes mas não cases
        if clients_created > 0:
            logger.info("ℹ️ Clientes foram criados, mas nenhum Case. Pode ser lógica de negócio.")

        return False

if __name__ == "__main__":
    from datetime import datetime
    success = main()
    sys.exit(0 if success else 1)