#!/usr/bin/env python3
"""Teste do parser simplificado"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file

def test_simple_parser():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    print("=== TESTE DO PARSER SIMPLIFICADO ===")

    try:
        meta, lines, stats = parse_inetconsig_file(content)
        print(f"SUCESSO! Parse realizado")
        print(f"  Entidade: {meta['entity_code']}-{meta['entity_name']}")
        print(f"  Referencia: {meta['ref_month']:02d}/{meta['ref_year']}")
        print(f"  Linhas processadas: {len(lines)}")
        print(f"  Stats: {stats}")

        if lines:
            print(f"\nPrimeiras 3 linhas processadas:")
            for i, line in enumerate(lines[:3]):
                print(f"  Linha {i+1}:")
                print(f"    CPF: {line['cpf']}")
                print(f"    Matricula: {line['matricula']}")
                print(f"    FIN: {line['financiamento_code']}")
                print(f"    ORGAO: {line['orgao']}")
                print(f"    LANC: {line['lanc']}")
                print(f"    TOTAL: {line['total_parcelas']}")
                print(f"    PAGO: {line['parcelas_pagas']}")
                print(f"    VALOR: {line['valor_parcela_ref']}")
                print(f"    ORGAO PGTO: {line['orgao_pagamento']}")
                print()

        print("=== PARSER FUNCIONANDO! ===")
        return True

    except Exception as e:
        print(f"ERRO: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_simple_parser()