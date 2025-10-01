"""Debug da regex"""
import re
from pathlib import Path

file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

with open(file_path, encoding="latin-1") as f:
    lines = [f.readline() for _ in range(20)]

# Pegar linha 9 (primeira linha de dados)
test_line = lines[8]  # índice 8 = linha 9

print("[*] Linha original (repr):")
print(repr(test_line))

print("\n[*] Linha visual:")
print(test_line)

print("\n[*] Comprimento:", len(test_line))

print("\n[*] Caracteres por posicao (primeiros 140):")
for i in range(min(140, len(test_line))):
    char = test_line[i]
    if char == ' ':
        print(f"  Pos {i:3d}: [ESPACO]")
    elif char == '\t':
        print(f"  Pos {i:3d}: [TAB]")
    elif char == '\n':
        print(f"  Pos {i:3d}: [NEWLINE]")
    else:
        print(f"  Pos {i:3d}: '{char}'")

# Tentar regex simples primeiro
print("\n[*] Testando regex simples por partes...")

# Status
status_re = re.compile(r"^\s*([1-6S])\s+")
status_match = status_re.match(test_line)
if status_match:
    print(f"[OK] STATUS capturado: '{status_match.group(1)}'")
else:
    print("[ERRO] STATUS nao capturado")

# Matricula
mat_re = re.compile(r"^\s*([1-6S])\s+([0-9X-]+)\s+")
mat_match = mat_re.match(test_line)
if mat_match:
    print(f"[OK] MATRICULA capturada: '{mat_match.group(2)}'")
else:
    print("[ERRO] MATRICULA nao capturada")