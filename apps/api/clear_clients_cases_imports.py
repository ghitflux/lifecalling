#!/usr/bin/env python3
"""
Script de manutenção para limpar listas de:
- Clientes (e telefones)
- Atendimentos (cases e dependências)
- Importações (lotes e linhas, modelos legados e normalizados)

Executa em ordem segura para respeitar FKs.
"""
from app.db import SessionLocal
from app.models import (
    # Clientes
    Client, ClientPhone,
    # Casos e dependências
    Case, CaseEvent, Attachment, Simulation, Contract, ContractAttachment, Payment,
    # Importações - novo modelo iNETConsig
    ImportBatch, PayrollLine,
    # Importações - modelos normalizados
    PayrollImportBatch, PayrollImportItem, PayrollClient, PayrollContract,
    # Importações - legado
    Import,
)

import sys
import os
from datetime import datetime

# Permitir imports de "app.*" ao executar fora do container
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Adiciona a pasta 'apps/api' ao sys.path, para que 'app' seja resolvido
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)




def clear_cases(db):
    print("🧹 Limpando atendimentos (cases) e dependências...")

    # Dependências primeiro para respeitar FKs
    payments_deleted = db.query(Payment).delete(synchronize_session=False)
    print(f"   - Removidos {payments_deleted} pagamentos")

    contract_attachments_deleted = db.query(ContractAttachment).delete(synchronize_session=False)
    print(f"   - Removidos {contract_attachments_deleted} anexos de contrato")

    contracts_deleted = db.query(Contract).delete(synchronize_session=False)
    print(f"   - Removidos {contracts_deleted} contratos")

    # Simulações: nullificar referência em cases e remover simulações
    updated_cases = db.query(Case).update({Case.last_simulation_id: None}, synchronize_session=False)
    print(f"   - Nullificados last_simulation_id em {updated_cases} cases")

    simulations_deleted = db.query(Simulation).delete(synchronize_session=False)
    print(f"   - Removidas {simulations_deleted} simulações")

    attachments_deleted = db.query(Attachment).delete(synchronize_session=False)
    print(f"   - Removidos {attachments_deleted} anexos de casos")

    case_events_deleted = db.query(CaseEvent).delete(synchronize_session=False)
    print(f"   - Removidos {case_events_deleted} eventos de casos")

    # Finalmente, os casos
    cases_deleted = db.query(Case).delete(synchronize_session=False)
    print(f"   - Removidos {cases_deleted} atendimentos (cases)")


def clear_clients(db):
    print("🧹 Limpando clientes e telefones...")

    phones_deleted = db.query(ClientPhone).delete(synchronize_session=False)
    print(f"   - Removidos {phones_deleted} telefones de clientes")

    clients_deleted = db.query(Client).delete(synchronize_session=False)
    print(f"   - Removidos {clients_deleted} clientes")


def clear_imports(db):
    print("🧹 Limpando importações (lotes, linhas e modelos normalizados/legados)...")

    # Novo modelo iNETConsig: ImportBatch -> PayrollLine (CASCADE nas linhas)
    payroll_lines_deleted = db.query(PayrollLine).delete(synchronize_session=False)
    print(f"   - Removidas {payroll_lines_deleted} linhas de folha (payroll_lines)")

    import_batches_deleted = db.query(ImportBatch).delete(synchronize_session=False)
    print(f"   - Removidos {import_batches_deleted} lotes de importação (import_batches)")

    # Modelos normalizados de importação de folha
    payroll_import_items_deleted = db.query(PayrollImportItem).delete(synchronize_session=False)
    print(f"   - Removidos {payroll_import_items_deleted} itens de importação normalizada")

    payroll_contracts_deleted = db.query(PayrollContract).delete(synchronize_session=False)
    print(f"   - Removidos {payroll_contracts_deleted} contratos normalizados de folha")

    payroll_clients_deleted = db.query(PayrollClient).delete(synchronize_session=False)
    print(f"   - Removidos {payroll_clients_deleted} clientes normalizados de folha")

    payroll_import_batches_deleted = db.query(PayrollImportBatch).delete(synchronize_session=False)
    print(f"   - Removidos {payroll_import_batches_deleted} lotes normalizados de folha")

    # Modelo legado (referenciado por Case.import_batch_id) — seguro após remover cases
    legacy_imports_deleted = db.query(Import).delete(synchronize_session=False)
    print(f"   - Removidas {legacy_imports_deleted} importações legadas (imports)")


def run():
    print("🚨 Confirmação necessária: esta ação IRÁ APAGAR dados de clientes, atendimentos e importações.")
    confirm = os.environ.get("CONFIRM") or input("Digite 'SIM' para confirmar: ").strip()
    if confirm.upper() != 'SIM':
        print("❌ Operação cancelada.")
        return

    with SessionLocal() as db:
        try:
            start = datetime.utcnow()
            print(f"⏱️ Iniciando limpeza às {start}")

            # Ordem segura: casos -> clientes -> importações
            clear_cases(db)
            clear_clients(db)
            clear_imports(db)

            db.commit()
            end = datetime.utcnow()
            print(f"✅ Limpeza concluída com sucesso às {end} (durou {(end-start).seconds}s)")
        except Exception as e:
            db.rollback()
            print("❌ Erro ao executar limpeza:", e)
            raise

if __name__ == '__main__':
    run()
