"""
Teste de parcelas TOTAL/PAGO corretas e órgãos pagadores
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

print(f"[*] Testando arquivo: {file_path.name}")

# Ler arquivo
with open(file_path, encoding="latin-1") as f:
    content = f.read()

# Parse
print("\n[*] Fazendo parse...")
meta, lines, stats = parse_inetconsig_file(content)

print(f"\n== Resultados ==")
print(f"   Total de linhas: {stats['total_lines']}")
print(f"   Clientes unicos: {stats['unique_clients']}")

# Verificar primeiras 5 linhas
print(f"\n== Primeiras 5 linhas (TOTAL/PAGO/ORGAO) ==")
for i, line in enumerate(lines[:5], 1):
    print(f"\n   Linha {i}:")
    print(f"      Nome: {line['nome']}")
    print(f"      FIN: {line['financiamento_code']}")
    print(f"      TOTAL parcelas: {line['total_parcelas']}")
    print(f"      PAGAS parcelas: {line['parcelas_pagas']}")
    print(f"      Valor: R$ {line['valor_parcela_ref']}")
    print(f"      Orgao PGTO: {line['orgao_pagamento']}")
    print(f"      Orgao NOME: {line.get('orgao_pagamento_nome', 'N/A')}")

# Verificar se pegou nomes de órgãos
print(f"\n== Orgaos Pagadores Encontrados ==")
orgaos_unicos = {}
for line in lines:
    codigo = line['orgao_pagamento']
    nome = line.get('orgao_pagamento_nome', '')
    if codigo and nome:
        orgaos_unicos[codigo] = nome

for codigo, nome in sorted(orgaos_unicos.items()):
    print(f"   {codigo}: {nome}")

print(f"\n[OK] Total de orgaos pagadores mapeados: {len(orgaos_unicos)}")

# Validar que TOTAL > PAGO
print(f"\n== Validando TOTAL >= PAGO ==")
erros = 0
for i, line in enumerate(lines, 1):
    if line['total_parcelas'] < line['parcelas_pagas']:
        print(f"   [ERRO] Linha {i}: TOTAL({line['total_parcelas']}) < PAGO({line['parcelas_pagas']})")
        erros += 1

if erros == 0:
    print(f"   [OK] Todas as {len(lines)} linhas tem TOTAL >= PAGO")
else:
    print(f"   [ERRO] {erros} linhas com TOTAL < PAGO!")