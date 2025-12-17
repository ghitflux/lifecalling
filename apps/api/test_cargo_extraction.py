"""
Script de teste para verificar extração de cargo
"""
import re

# Simular uma linha do arquivo
test_lines = [
    "  1    135866-9  TERMUZA RODRIGUES DE MORAIS    5-PROFESSOR-20H                6260      914     068   016         302,71      914    34120157334",
    "  1    135867-7  ALESSANDRA MARIA PINTO DE SOUS 1-PROFESSOR 40H                6260      914     060   010         871,34      914    70615020372",
]

for test_line in test_lines:
    print(f"\nTestando linha: {test_line}")

    # Tokenizar por espaços (como o parser faz)
    tokens = test_line.split()
    print(f"Tokens: {tokens}")

    # Encontrar índice do FIN (primeiro token que é número de 4 dígitos)
    fin_idx = -1
    for i, t in enumerate(tokens):
        if t.isdigit() and len(t) == 4:
            fin_idx = i
            break

    print(f"FIN index: {fin_idx}")

    if fin_idx > 2:
        matricula = tokens[1]
        nome_cargo_part = " ".join(tokens[2:fin_idx])
        print(f"Matrícula: {matricula}")
        print(f"Nome+Cargo parte: '{nome_cargo_part}'")

        # Tentar separar NOME de CARGO
        parts_list = re.split(r'(\d+-)', nome_cargo_part)
        print(f"Parts após split: {parts_list}")

        if len(parts_list) > 1:
            nome = parts_list[0].strip()
            cargo = (parts_list[1] + parts_list[2]).strip() if len(parts_list) > 2 else ""
            print(f"Nome extraído: '{nome}'")
            print(f"Cargo extraído: '{cargo}'")
        else:
            print("Não conseguiu separar nome e cargo")
