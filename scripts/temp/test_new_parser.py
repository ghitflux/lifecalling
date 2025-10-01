"""Teste do novo parser"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

print("[*] Lendo primeiras 300 linhas...")
with open(file_path, encoding="latin-1") as f:
    lines = [f.readline() for _ in range(300)]
    content = "".join(lines)

print("[*] Fazendo parse...")
try:
    meta, parsed_lines, stats = parse_inetconsig_file(content)

    print(f"\n[OK] Parse concluido!")
    print(f"\n== Metadados ==")
    print(f"   Entidade: {meta['entity_code']} - {meta['entity_name']}")
    print(f"   Referencia: {meta['ref_month']:02d}/{meta['ref_year']}")

    print(f"\n== Estatisticas ==")
    print(f"   Total de linhas: {stats['total_lines']}")
    print(f"   Clientes unicos: {stats['unique_clients']}")

    print(f"\n== Primeiras 5 linhas ==")
    for i, line in enumerate(parsed_lines[:5], 1):
        print(f"\n   Linha {i}:")
        print(f"      CPF: {line['cpf']}")
        print(f"      Matricula: {line['matricula']}")
        print(f"      Nome: {line['nome']}")
        print(f"      FIN: {line['financiamento_code']}")
        print(f"      Orgao: {line['orgao']}")
        print(f"      Lanc: {line['lanc']}")
        print(f"      Total/Pago: {line['total_parcelas']}/{line['parcelas_pagas']}")
        print(f"      Valor: R$ {line['valor_parcela_ref']}")
        print(f"      Orgao PGTO: {line['orgao_pagamento']}")

    print(f"\n[OK] Parser funcionando! Total processado: {len(parsed_lines)} linhas")

except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()