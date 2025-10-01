"""Analisa a estrutura completa da linha"""
from pathlib import Path

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

with open(file_path, encoding="latin-1") as f:
    lines = [f.readline() for _ in range(20)]

test_line = lines[8].rstrip('\n')  # Primeira linha de dados

print("Linha completa:")
print(test_line)
print(f"\nComprimento: {len(test_line)}")

# Extrair CPF (últimos 11 dígitos)
cpf = test_line[-11:]
print(f"\nCPF (últimos 11): '{cpf}'")

# Trabalhar de trás para frente
remaining = test_line[:-11].rstrip()
print(f"\nApós remover CPF: '{remaining}'")

# ORGAO PGTO - 3 dígitos antes do CPF
orgao_pgto_match = remaining.split()[-1]
print(f"\nORGAO PGTO (último campo): '{orgao_pgto_match}'")

remaining = remaining[:remaining.rfind(orgao_pgto_match)].rstrip()

# VALOR - campo antes do ORGAO PGTO
valor_match = remaining.split()[-1]
print(f"\nVALOR: '{valor_match}'")

remaining = remaining[:remaining.rfind(valor_match)].rstrip()

# PARCELAS PAGAS
parcelas_pagas = remaining.split()[-1]
print(f"\nPARCELAS PAGAS: '{parcelas_pagas}'")

remaining = remaining[:remaining.rfind(parcelas_pagas)].rstrip()

# TOTAL PARCELAS
total_parcelas = remaining.split()[-1]
print(f"\nTOTAL PARCELAS: '{total_parcelas}'")

remaining = remaining[:remaining.rfind(total_parcelas)].rstrip()

# LANC
lanc = remaining.split()[-1]
print(f"\nLANC: '{lanc}'")

remaining = remaining[:remaining.rfind(lanc)].rstrip()

# ORGAO
orgao = remaining.split()[-1]
print(f"\nORGAO: '{orgao}'")

remaining = remaining[:remaining.rfind(orgao)].rstrip()

# Encontrar o FIN (deve ser 4 dígitos numéricos)
tokens = remaining.split()
fin_idx = None
for i in range(len(tokens) - 1, -1, -1):
    if tokens[i].isdigit() and len(tokens[i]) == 4:
        fin = tokens[i]
        fin_idx = i
        break

print(f"\nFIN (4 dígitos): '{fin}'")

# Reconstruir remaining sem o FIN
remaining_tokens = tokens[:fin_idx]
remaining = ' '.join(remaining_tokens)
print(f"\nRestante (STATUS + MATRICULA + NOME + CARGO): '{remaining}'")

# Agora analisar o início
parts = remaining.split(maxsplit=2)  # STATUS, MATRICULA, resto
status = parts[0]
matricula = parts[1]
nome_cargo = parts[2] if len(parts) > 2 else ""

print(f"\nSTATUS: '{status}'")
print(f"MATRICULA: '{matricula}'")
print(f"NOME+CARGO: '{nome_cargo}'")