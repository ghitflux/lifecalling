"""
Script de teste para validar a importação do arquivo Txt Retorno.txt
"""

import sys
from pathlib import Path

# Adicionar o diretório da API ao path
sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import (
    parse_inetconsig_file,
    validate_inetconsig_content
)

def test_txt_retorno():
    """Testa o parse do arquivo Txt Retorno.txt"""

    file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

    if not file_path.exists():
        print(f"[ERRO] Arquivo nao encontrado: {file_path}")
        return

    print(f"[*] Lendo arquivo: {file_path}")

    # Ler arquivo com encoding correto
    for encoding in ["latin-1", "cp1252", "iso-8859-1", "utf-8"]:
        try:
            content = file_path.read_text(encoding=encoding)
            print(f"[OK] Arquivo decodificado com {encoding}")
            break
        except UnicodeDecodeError:
            continue
    else:
        content = file_path.read_text(encoding="latin-1", errors="replace")
        print("[AVISO] Usando latin-1 com replace")

    # Validar conteúdo
    print("\n[*] Validando formato do arquivo...")
    errors = validate_inetconsig_content(content)

    if errors:
        print("[ERRO] Erros de validacao encontrados:")
        for error in errors:
            print(f"   - {error}")
        return

    print("[OK] Formato valido!")

    # Parse do arquivo
    print("\n[*] Fazendo parse do arquivo...")
    try:
        meta, lines, stats = parse_inetconsig_file(content)

        print(f"\n[OK] Parse concluido com sucesso!")
        print(f"\n== Metadados ==")
        print(f"   - Entidade: {meta['entity_code']} - {meta['entity_name']}")
        print(f"   - Referencia: {meta['ref_month']:02d}/{meta['ref_year']}")
        print(f"   - Data de Geracao: {meta['generated_at'].strftime('%d/%m/%Y')}")

        print(f"\n== Estatisticas ==")
        print(f"   - Total de linhas: {stats['total_lines']}")
        print(f"   - Clientes unicos: {stats['unique_clients']}")
        print(f"   - Distribuicao de status:")
        for status, info in stats['status_distribution'].items():
            print(f"      * Status {status}: {info['count']} linhas - {info['description']}")

        # Mostrar primeiras 3 linhas como exemplo
        print(f"\n== Primeiras 3 linhas processadas ==")
        for i, line in enumerate(lines[:3], 1):
            print(f"\n   Linha {i}:")
            print(f"      - CPF: {line['cpf']}")
            print(f"      - Matricula: {line['matricula']}")
            print(f"      - Nome: {line['nome']}")
            print(f"      - FIN: {line['financiamento_code']}")
            print(f"      - Orgao: {line['orgao']}")
            print(f"      - Lanc: {line['lanc']}")
            print(f"      - Total Parcelas: {line['total_parcelas']}")
            print(f"      - Parcelas Pagas: {line['parcelas_pagas']}")
            print(f"      - Valor: R$ {line['valor_parcela_ref']}")
            print(f"      - Orgao PGTO: {line['orgao_pagamento']}")

        print(f"\n[OK] Teste concluido! Arquivo pronto para importacao.")
        return True

    except Exception as e:
        print(f"\n[ERRO] Erro durante o parse: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_txt_retorno()