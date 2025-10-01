#!/usr/bin/env python3
"""Teste de uma única linha para identificar erro específico"""

import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.db import SessionLocal
from app.models import ImportBatch, PayrollLine, Client, Case

def test_single_line():
    print("=== TESTE DE UMA ÚNICA LINHA ===")

    db = SessionLocal()

    try:
        # Criar batch
        batch = ImportBatch(
            entity_code="1042",
            entity_name="BANCO SANTANDER S.A",
            ref_month=7,
            ref_year=2025,
            generated_at=datetime.utcnow(),
            filename="teste_single_line.txt",
            created_by=7
        )
        db.add(batch)
        db.flush()
        print(f"OK Batch criado: {batch.id}")

        # Criar cliente
        client = Client(
            cpf="47082976372",
            matricula="000550-9",
            name="JOANA MARIA DOS SANTOS IBIAPIN",
            orgao="BANCO SANTANDER S.A"
        )
        db.add(client)
        db.flush()
        print(f"OK Cliente criado: {client.id}")

        # Testar criação de PayrollLine com dados reais do parser
        line_data = {
            "batch_id": batch.id,
            "cpf": "47082976372",
            "matricula": "000550-9",
            "nome": "",
            "cargo": "",
            "status_code": "1",
            "status_description": "Lançado e Efetivado",
            "financiamento_code": "6490",
            "orgao": "001",
            "lanc": "088",
            "total_parcelas": 24,
            "parcelas_pagas": 458,
            "valor_parcela_ref": 458.04,
            "orgao_pagamento": "001",
            "entity_code": "1042",
            "entity_name": "BANCO SANTANDER S.A",
            "ref_month": 7,
            "ref_year": 2025,
            "line_number": 9
        }

        try:
            payroll_line = PayrollLine(**line_data)
            db.add(payroll_line)
            db.flush()
            print(f"OK PayrollLine criada: {payroll_line.id}")
        except Exception as line_error:
            print(f"ERRO ao criar PayrollLine: {line_error}")
            import traceback
            traceback.print_exc()

        # Testar criação de Case
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
            print(f"✅ Case criado: {case.id}")
        except Exception as case_error:
            print(f"❌ Erro ao criar Case: {case_error}")
            import traceback
            traceback.print_exc()

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
    test_single_line()