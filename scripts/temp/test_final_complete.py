"""
Teste final completo da importação
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file, validate_inetconsig_content
from app.db import SessionLocal
from app.models import ImportBatch, PayrollLine, Client, Case, User
from collections import defaultdict
from datetime import datetime

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

print(f"[*] Testando com arquivo completo: {file_path.name}")
print(f"[*] Tamanho: {file_path.stat().st_size / 1024:.1f} KB\n")

# Ler arquivo
with open(file_path, encoding="latin-1") as f:
    content = f.read()

# Validar
errors = validate_inetconsig_content(content)
if errors:
    print(f"[ERRO] Validacao falhou: {errors}")
    exit(1)

print("[OK] Formato valido")

# Parse
print("\n[*] Fazendo parse...")
meta, lines, stats = parse_inetconsig_file(content)

print(f"\n== Resultados do Parse ==")
print(f"   Total de linhas processadas: {stats['total_lines']}")
print(f"   Clientes unicos: {stats['unique_clients']}")

# Verificar nomes (devem ter no máximo 3 palavras)
print(f"\n[*] Verificando limitacao de nomes...")
for i, line in enumerate(lines[:5], 1):
    nome_parts = line['nome'].split()
    print(f"   {i}. {line['nome']} ({len(nome_parts)} palavras)")

if all(len(line['nome'].split()) <= 3 for line in lines[:10]):
    print("[OK] Nomes limitados a 3 palavras")
else:
    print("[AVISO] Alguns nomes tem mais de 3 palavras")

# Conectar ao banco
db = SessionLocal()

try:
    # Buscar admin
    admin = db.query(User).filter(User.email == "admin@lifecalling.com").first()

    # Criar batch
    print(f"\n[*] Criando batch de importacao...")
    batch = ImportBatch(
        entity_code=meta["entity_code"],
        entity_name=meta["entity_name"],
        ref_month=meta["ref_month"],
        ref_year=meta["ref_year"],
        generated_at=meta.get("generated_at", datetime.utcnow()),
        created_by=admin.id if admin else None,
        filename=file_path.name,
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

    # Aplicar limite de 50
    MAX_CLIENTS = 50
    total_clients = len(client_lines)

    print(f"\n[*] Total de clientes no arquivo: {total_clients}")

    if total_clients > MAX_CLIENTS:
        print(f"[AVISO] Limitando a {MAX_CLIENTS} clientes")

    # Processar
    clients_created = 0
    cases_created = 0
    lines_created = 0
    processed = 0

    for (cpf, matricula), client_line_group in client_lines.items():
        if processed >= MAX_CLIENTS:
            break

        processed += 1
        first_line = client_line_group[0]

        # Criar cliente
        client = Client(
            cpf=cpf,
            matricula=matricula,
            name=first_line["nome"],  # Ja deve estar limitado a 3 palavras
            orgao=meta["entity_name"]
        )
        db.add(client)
        db.flush()
        clients_created += 1

        # Criar caso
        case = Case(
            client_id=client.id,
            status="novo",
            source="import",
            entity_code=batch.entity_code,
            ref_month=batch.ref_month,
            ref_year=batch.ref_year,
            import_batch_id_new=batch.id,
            # created_at sera preenchido automaticamente
            entidade=batch.entity_name,
            referencia_competencia=f"{batch.ref_month:02d}/{batch.ref_year}"
        )
        db.add(case)
        db.flush()
        cases_created += 1

        # Registrar linhas
        for line in client_line_group:
            payroll_line = PayrollLine(
                batch_id=batch.id,
                cpf=line["cpf"],
                matricula=line["matricula"],
                nome=line["nome"],
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

    db.commit()

    print(f"\n== Resultados da Importacao ==")
    print(f"   Clientes criados: {clients_created}")
    print(f"   Casos criados: {cases_created}")
    print(f"   Linhas de payroll: {lines_created}")

    # Validar created_at
    print(f"\n[*] Validando campo created_at...")
    sample_case = db.query(Case).first()
    if sample_case and sample_case.created_at:
        print(f"[OK] Campo created_at presente: {sample_case.created_at}")
    else:
        print("[ERRO] Campo created_at ausente!")

    # Validar nomes no banco
    print(f"\n[*] Validando nomes no banco...")
    sample_clients = db.query(Client).limit(5).all()
    for client in sample_clients:
        print(f"   - {client.name} (CPF: {client.cpf})")

    print(f"\n[OK] TESTE CONCLUIDO COM SUCESSO!")

    if total_clients > MAX_CLIENTS:
        print(f"\n[INFO] {total_clients - MAX_CLIENTS} clientes restantes nao foram importados devido ao limite.")

finally:
    db.close()