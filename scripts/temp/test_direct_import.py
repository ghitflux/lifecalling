"""
Teste direto da importação sem autenticação (via código Python)
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file, validate_inetconsig_content
from app.db import SessionLocal
from app.models import ImportBatch, PayrollLine, Client, Case, User
from collections import defaultdict
from datetime import datetime

def test_import():
    """Testa importação completa via código"""

    file_path = Path(__file__).parent / "teste_pequeno_100linhas.txt"

    if not file_path.exists():
        print(f"[ERRO] Arquivo não encontrado: {file_path}")
        return

    print(f"[*] Lendo arquivo: {file_path}")

    # Ler arquivo
    with open(file_path, encoding="latin-1") as f:
        content = f.read()

    print(f"[*] Tamanho: {len(content)} bytes")

    # Validar
    print("[*] Validando formato...")
    errors = validate_inetconsig_content(content)
    if errors:
        print(f"[ERRO] Validação falhou: {errors}")
        return

    print("[OK] Formato válido")

    # Parse
    print("[*] Fazendo parse...")
    meta, lines, stats = parse_inetconsig_file(content)

    print(f"[OK] Parse concluído")
    print(f"   Total linhas: {stats['total_lines']}")
    print(f"   Clientes únicos: {stats['unique_clients']}")

    # Conectar ao banco
    print("\n[*] Conectando ao banco...")
    db = SessionLocal()

    try:
        # Buscar usuário admin para atribuir ao batch
        admin = db.query(User).filter(User.email == "admin@lifecalling.com").first()

        if not admin:
            print("[AVISO] Usuário admin não encontrado, criando batch sem usuário")
            user_id = None
        else:
            user_id = admin.id
            print(f"[OK] Usuário admin encontrado: {admin.name}")

        # Criar batch
        print("\n[*] Criando batch de importação...")
        batch = ImportBatch(
            entity_code=meta["entity_code"],
            entity_name=meta["entity_name"],
            ref_month=meta["ref_month"],
            ref_year=meta["ref_year"],
            generated_at=meta.get("generated_at", datetime.utcnow()),
            created_by=user_id,
            filename="teste_pequeno_100linhas.txt",
            total_lines=len(lines),
            processed_lines=0,
            error_lines=0
        )
        db.add(batch)
        db.flush()

        print(f"[OK] Batch criado: ID {batch.id}")

        # Agrupar por cliente
        client_lines = defaultdict(list)
        for line in lines:
            key = (line["cpf"], line["matricula"])
            client_lines[key].append(line)

        print(f"\n[*] Processando {len(client_lines)} clientes...")

        clients_created = 0
        cases_created = 0
        lines_created = 0

        # Processar cada cliente
        for (cpf, matricula), client_line_group in client_lines.items():
            first_line = client_line_group[0]

            # Verificar/criar cliente
            client = db.query(Client).filter(
                Client.cpf == cpf,
                Client.matricula == matricula
            ).first()

            if not client:
                client = Client(
                    cpf=cpf,
                    matricula=matricula,
                    name=first_line["nome"],
                    orgao=meta["entity_name"]
                )
                db.add(client)
                db.flush()
                clients_created += 1

            # Criar caso
            existing_case = db.query(Case).filter(
                Case.client_id == client.id,
                Case.entity_code == batch.entity_code,
                Case.ref_month == batch.ref_month,
                Case.ref_year == batch.ref_year
            ).first()

            if not existing_case:
                new_case = Case(
                    client_id=client.id,
                    status="novo",
                    source="import",
                    entity_code=batch.entity_code,
                    ref_month=batch.ref_month,
                    ref_year=batch.ref_year,
                    import_batch_id_new=batch.id,
                    last_update_at=datetime.utcnow(),
                    entidade=batch.entity_name,
                    referencia_competencia=f"{batch.ref_month:02d}/{batch.ref_year}"
                )
                db.add(new_case)
                db.flush()
                cases_created += 1

            # Registrar linhas
            for line in client_line_group:
                payroll_line = PayrollLine(
                    batch_id=batch.id,
                    cpf=line["cpf"],
                    matricula=line["matricula"],
                    nome=line.get("nome", ""),
                    cargo=line.get("cargo", ""),
                    status_code=line["status_code"],
                    status_description=line["status_description"],
                    financiamento_code=line["financiamento_code"],
                    orgao=line["orgao"],
                    lanc=line["lanc"],
                    total_parcelas=line["total_parcelas"],
                    parcelas_pagas=line["parcelas_pagas"],
                    valor_parcela_ref=line["valor_parcela_ref"],
                    orgao_pagamento=line["orgao_pagamento"],
                    entity_code=line["entity_code"],
                    entity_name=line["entity_name"],
                    ref_month=line["ref_month"],
                    ref_year=line["ref_year"],
                    line_number=line.get("line_number")
                )
                db.add(payroll_line)
                lines_created += 1

        # Commit final
        db.commit()

        print(f"\n✅ IMPORTAÇÃO CONCLUÍDA!")
        print(f"   Clientes criados: {clients_created}")
        print(f"   Casos criados: {cases_created}")
        print(f"   Linhas criadas: {lines_created}")

        # Validar dados
        print(f"\n[*] Validando dados no banco...")
        total_clients = db.query(Client).count()
        total_cases = db.query(Case).count()
        total_lines = db.query(PayrollLine).count()
        total_batches = db.query(ImportBatch).count()

        print(f"[OK] Total no banco:")
        print(f"   Clientes: {total_clients}")
        print(f"   Casos: {total_cases}")
        print(f"   Linhas de payroll: {total_lines}")
        print(f"   Batches: {total_batches}")

        print(f"\n✅ TESTE CONCLUÍDO COM SUCESSO!")

    except Exception as e:
        db.rollback()
        print(f"\n[ERRO] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_import()