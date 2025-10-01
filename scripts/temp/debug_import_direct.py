#!/usr/bin/env python3
"""Debug direto da importação sem API"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file
from app.models import ImportBatch, PayrollLine, Client, Case
from app.db import SessionLocal

def debug_import():
    print("=== DEBUG DIRETO DA IMPORTAÇÃO ===")

    # Ler arquivo pequeno
    with open('teste_pequeno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Parse do arquivo
    meta, lines, stats = parse_inetconsig_file(content)
    print(f"Parse: {len(lines)} linhas, {stats['unique_clients']} clientes únicos")

    # Conectar banco
    db = SessionLocal()

    try:
        # Criar batch
        batch = ImportBatch(
            entity_code=meta["entity_code"],
            entity_name=meta["entity_name"],
            ref_month=meta["ref_month"],
            ref_year=meta["ref_year"],
            filename="teste_pequeno.txt",
            created_by=7  # Admin
        )
        db.add(batch)
        db.flush()
        print(f"Batch criado: {batch.id}")

        # Pegar primeira linha para teste
        test_line = lines[0]
        print(f"Testando linha: CPF {test_line['cpf']}, FIN {test_line['financiamento_code']}")

        # Criar cliente se não existir
        client = db.query(Client).filter(
            Client.cpf == test_line["cpf"],
            Client.matricula == test_line["matricula"]
        ).first()

        if not client:
            client = Client(
                cpf=test_line["cpf"],
                matricula=test_line["matricula"],
                name=test_line.get("nome", "TESTE"),
                orgao=meta["entity_name"]
            )
            db.add(client)
            db.flush()
            print(f"Cliente criado: {client.id}")
        else:
            print(f"Cliente existente: {client.id}")

        # Tentar criar linha PayrollLine
        try:
            payroll_line = PayrollLine(
                batch_id=batch.id,
                cpf=test_line["cpf"],
                matricula=test_line["matricula"],
                nome=test_line.get("nome", ""),
                cargo=test_line.get("cargo", ""),
                status_code=test_line["status_code"],
                status_description=test_line["status_description"],
                financiamento_code=test_line["financiamento_code"],
                orgao=test_line["orgao"],
                lanc=test_line["lanc"],
                total_parcelas=test_line["total_parcelas"],
                parcelas_pagas=test_line["parcelas_pagas"],
                valor_parcela_ref=test_line["valor_parcela_ref"],
                orgao_pagamento=test_line["orgao_pagamento"],
                entity_code=test_line["entity_code"],
                entity_name=test_line["entity_name"],
                ref_month=test_line["ref_month"],
                ref_year=test_line["ref_year"],
                line_number=test_line.get("line_number")
            )
            db.add(payroll_line)
            db.flush()
            print(f"✅ PayrollLine criada: {payroll_line.id}")

        except Exception as line_error:
            print(f"❌ Erro ao criar PayrollLine: {line_error}")
            import traceback
            traceback.print_exc()

        # Tentar criar caso
        try:
            case = Case(
                client_id=client.id,
                status="novo",
                source="import",
                entity_code=batch.entity_code,
                ref_month=batch.ref_month,
                ref_year=batch.ref_year,
                import_batch_id_new=batch.id,
                payroll_status_summary={"1": 1},
                entidade=batch.entity_name,
                referencia_competencia=f"{batch.ref_month:02d}/{batch.ref_year}"
            )
            db.add(case)
            db.flush()
            print(f"✅ Caso criado: {case.id}")

        except Exception as case_error:
            print(f"❌ Erro ao criar Caso: {case_error}")
            import traceback
            traceback.print_exc()

        # Commit final
        db.commit()
        print("✅ Commit realizado com sucesso!")

    except Exception as e:
        db.rollback()
        print(f"❌ Erro geral: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_import()