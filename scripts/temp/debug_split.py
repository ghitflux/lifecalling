"""Debug do split"""
from pathlib import Path

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

with open(file_path, encoding="latin-1") as f:
    lines = [f.readline() for _ in range(20)]

test_line = lines[8].rstrip('\n')  # Primeira linha de dados

print("Linha:")
print(test_line)

# Remover CPF
cpf = test_line[-11:]
print(f"\nCPF: {cpf}")

remaining = test_line[:-11].rstrip()
print(f"\nRestante: '{remaining}'")

# Split em tokens
tokens = remaining.split()
print(f"\nTotal tokens: {len(tokens)}")
print("\nTodos os tokens:")
for i, token in enumerate(tokens):
    print(f"   [{i}] '{token}'")

print("\n== Analisando da direita para esquerda ==")
print(f"[-1] ORGAO PGTO: {tokens[-1]}")
print(f"[-2] VALOR: {tokens[-2]}")
print(f"[-3] PAGO: {tokens[-3]}")
print(f"[-4] TOTAL: {tokens[-4]}")
print(f"[-5] LANC: {tokens[-5]}")
print(f"[-6] ORGAO (ou FIN?): {tokens[-6]}")
print(f"[-7] FIN (ou parte do cargo?): {tokens[-7]}")
print(f"[-8]: {tokens[-8] if len(tokens) > 8 else 'N/A'}")
print(f"[-9]: {tokens[-9] if len(tokens) > 9 else 'N/A'}")