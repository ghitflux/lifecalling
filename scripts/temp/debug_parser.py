#!/usr/bin/env python3
"""Script para testar o parser de importação"""

import sys
import os
import re

# Adicionar o diretório da API ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.services.payroll_inetconsig_parser import parse_header, HEADER_RE

def test_parser():
    # Ler o arquivo
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    print("=== TESTE DO PARSER ===")
    print(f"Tamanho do arquivo: {len(content)} caracteres")

    # Mostrar primeiras linhas
    lines = content.splitlines()
    print("\nPrimeiras 10 linhas:")
    for i, line in enumerate(lines[:10], 1):
        print(f"{i:2d}: {repr(line)}")

    # Testar regex do header
    print(f"\nTentando regex: {HEADER_RE.pattern}")
    match = HEADER_RE.search(content)
    if match:
        print(f"✅ Header encontrado: {match.groups()}")
        try:
            meta = parse_header(content)
            print(f"✅ Meta extraída: {meta}")
        except Exception as e:
            print(f"❌ Erro no parse_header: {e}")
    else:
        print("❌ Header não encontrado")

        # Tentar encontrar linha específica
        for i, line in enumerate(lines):
            if 'Entidade:' in line:
                print(f"Linha {i+1} com 'Entidade:': {repr(line)}")
            if 'Refer' in line:
                print(f"Linha {i+1} com 'Refer': {repr(line)}")

if __name__ == "__main__":
    test_parser()
