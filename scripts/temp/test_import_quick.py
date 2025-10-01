"""
Teste rápido do parser com primeiras 100 linhas
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import (
    parse_header,
    LINE_RE,
    normalize_cpf,
    normalize_currency,
    STATUS_LEGEND
)

def quick_test():
    file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

    print(f"[*] Lendo primeiras 200 linhas do arquivo...")

    # Ler apenas primeiras 200 linhas
    for encoding in ["latin-1", "cp1252", "iso-8859-1"]:
        try:
            with open(file_path, encoding=encoding) as f:
                lines = []
                for i, line in enumerate(f):
                    lines.append(line)
                    if i >= 200:
                        break
                content = "".join(lines)
            print(f"[OK] Arquivo decodificado com {encoding}")
            break
        except UnicodeDecodeError:
            continue

    # Parse do cabeçalho
    print("\n[*] Extraindo cabecalho...")
    try:
        meta = parse_header(content)
        print(f"[OK] Entidade: {meta['entity_code']} - {meta['entity_name']}")
        print(f"[OK] Referencia: {meta['ref_month']:02d}/{meta['ref_year']}")
    except Exception as e:
        print(f"[ERRO] Falha no cabecalho: {e}")
        return

    # Parse das linhas com regex
    print(f"\n[*] Testando regex LINE_RE...")
    matches = list(LINE_RE.finditer(content))
    print(f"[OK] Encontradas {len(matches)} linhas validas nas primeiras 200 linhas")

    if len(matches) == 0:
        print("[ERRO] Nenhuma linha foi capturada pela regex!")
        print("\n[DEBUG] Testando primeiras linhas do arquivo:")
        for i, line in enumerate(content.splitlines()[:20], 1):
            if line.strip():
                print(f"Linha {i}: {line[:80]}...")
        return

    # Mostrar primeira linha capturada
    print(f"\n== Primeira linha capturada ==")
    match = matches[0]

    matricula = match.group(2).strip()
    nome = match.group(3).strip()
    fin_code = match.group(5).strip()
    orgao = match.group(6).strip()
    lanc = match.group(7).strip()
    total = match.group(8).strip()
    pago = match.group(9).strip()
    valor_str = match.group(10).strip()
    orgao_pgto = match.group(11).strip() if match.group(11) else ""
    cpf = normalize_cpf(match.group(12).strip())

    print(f"   - CPF: {cpf}")
    print(f"   - Matricula: {matricula}")
    print(f"   - Nome: {nome}")
    print(f"   - FIN: {fin_code}")
    print(f"   - Orgao: {orgao}")
    print(f"   - Lanc: {lanc}")
    print(f"   - Total: {total}")
    print(f"   - Pago: {pago}")
    print(f"   - Valor: {valor_str} -> {normalize_currency(valor_str)}")
    print(f"   - Orgao PGTO: {orgao_pgto}")

    # Mostrar mais alguns exemplos
    print(f"\n== Proximas 4 linhas ==")
    for i, match in enumerate(matches[1:5], 2):
        cpf = normalize_cpf(match.group(12).strip())
        nome = match.group(3).strip()
        valor_str = match.group(10).strip()
        print(f"   {i}. {nome[:30]:30s} CPF: {cpf} Valor: {normalize_currency(valor_str)}")

    print(f"\n[OK] Parser funcionando corretamente!")
    print(f"[OK] Total de linhas validas encontradas: {len(matches)}")

if __name__ == "__main__":
    quick_test()