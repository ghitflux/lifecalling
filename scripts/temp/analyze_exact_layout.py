#!/usr/bin/env python3
"""
Análise exata do layout das colunas para extrair apenas campos essenciais:
MATRICULA, FIN, ORGAO, LANC, TOTAL, PAGO, ORGAO PGTO, CPF
"""

def analyze_exact_layout():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    lines = content.splitlines()

    # Encontrar linha de header
    header_line = None
    header_idx = -1
    for i, line in enumerate(lines):
        if 'STATUS' in line and 'MATRICULA' in line and 'FIN.' in line and 'CPF' in line:
            header_line = line
            header_idx = i
            break

    if not header_line:
        print("Header não encontrado!")
        return

    print("=== ANÁLISE EXATA DAS POSIÇÕES ===")
    print(f"Header encontrado na linha {header_idx + 1}:")
    print(header_line)
    print()

    # Mapear posições dos campos no header
    matricula_pos = header_line.find('MATRICULA')
    fin_pos = header_line.find('FIN.')
    orgao_pos = header_line.find('ORGAO')
    lanc_pos = header_line.find('LANC.')
    total_pos = header_line.find('TOTAL')
    pago_pos = header_line.find('PAGO')
    valor_pos = header_line.find('VALOR')
    orgao_pgto_pos = header_line.rfind('ORGAO')  # Segundo ORGAO é ORGAO PAGTO
    cpf_pos = header_line.find('CPF')

    print("Posições no header:")
    print(f"MATRICULA: {matricula_pos}")
    print(f"FIN.: {fin_pos}")
    print(f"ORGAO: {orgao_pos}")
    print(f"LANC.: {lanc_pos}")
    print(f"TOTAL: {total_pos}")
    print(f"PAGO: {pago_pos}")
    print(f"VALOR: {valor_pos}")
    print(f"ORGAO PAGTO: {orgao_pgto_pos}")
    print(f"CPF: {cpf_pos}")
    print()

    # Analisar primeira linha de dados
    data_line = None
    for line in lines[header_idx + 2:]:  # Pular linha de separação
        if line.strip() and line.strip()[0].isdigit():
            data_line = line
            break

    if data_line:
        print("Primeira linha de dados:")
        print(f"Conteúdo: {repr(data_line)}")
        print(f"Tamanho: {len(data_line)}")
        print()

        # Mapear visualmente
        print("Mapeamento visual (posição dos caracteres):")
        print("Posições: 0000000001111111111222222222233333333334444444444555555555566666666667777777777888888888899999999990000000000111111111122222222223333333333")
        print("          0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890")
        print(f"Dados   : {data_line}")
        print()

        # Extrair campos pelos padrões identificados
        print("Campos extraídos (tentativa por posições):")

        # MATRICULA - início da linha após STATUS
        matricula_start = 5
        matricula_end = 15
        matricula = data_line[matricula_start:matricula_end].strip()
        print(f"MATRICULA [{matricula_start}:{matricula_end}]: '{matricula}'")

        # CPF - últimos 11 caracteres
        cpf = data_line[-11:].strip()
        print(f"CPF [últimos 11]: '{cpf}'")

        # Tentar encontrar campos numéricos por padrões
        import re

        # Procurar por sequência de 4 dígitos (FIN)
        fin_match = re.search(r'\b(\d{4})\b', data_line[60:90])  # Buscar na região esperada
        fin = fin_match.group(1) if fin_match else ""
        print(f"FIN (4 dígitos): '{fin}'")

        # ORGAO, LANC, TOTAL, PAGO - procurar por grupos de 3 dígitos
        three_digit_matches = re.findall(r'\b(\d{3})\b', data_line[80:140])
        print(f"Grupos de 3 dígitos encontrados: {three_digit_matches}")

        if len(three_digit_matches) >= 4:
            orgao = three_digit_matches[0]
            lanc = three_digit_matches[1]
            total = three_digit_matches[2]
            pago = three_digit_matches[3] if len(three_digit_matches) > 3 else ""

            print(f"ORGAO: '{orgao}'")
            print(f"LANC: '{lanc}'")
            print(f"TOTAL: '{total}'")
            print(f"PAGO: '{pago}'")

        # ORGAO PGTO - próximo grupo de 3 dígitos antes do CPF
        orgao_pgto_pattern = r'\b(\d{3})\b\s*\d{11}\s*$'
        orgao_pgto_match = re.search(orgao_pgto_pattern, data_line)
        orgao_pgto = orgao_pgto_match.group(1) if orgao_pgto_match else ""
        print(f"ORGAO PGTO: '{orgao_pgto}'")

if __name__ == "__main__":
    analyze_exact_layout()