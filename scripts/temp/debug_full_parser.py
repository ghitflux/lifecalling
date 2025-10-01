import sys
import os
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.services.payroll_inetconsig_parser import LINE_RE

def test_lines():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    lines = content.splitlines()
    print("=== TESTE DAS LINHAS DE DADOS ===")
    
    # Procurar linhas que começam com número (status)
    data_lines = []
    for i, line in enumerate(lines):
        if re.match(r'^\s*[1-6S]\s+', line):
            data_lines.append((i+1, line))
    
    print(f"Encontradas {len(data_lines)} linhas que começam com status")
    
    if data_lines:
        print("\nPrimeiras 5 linhas de dados:")
        for line_num, line in data_lines[:5]:
            print(f"Linha {line_num}: {repr(line[:100])}...")
        
        # Testar regex
        print(f"\nRegex: {LINE_RE.pattern}")
        matches = 0
        for line_num, line in data_lines[:10]:
            match = LINE_RE.match(line)
            if match:
                matches += 1
                print(f"✓ Linha {line_num} match: {len(match.groups())} grupos")
            else:
                print(f"✗ Linha {line_num} não match: {repr(line[:60])}")
        
        print(f"\n{matches}/{min(10, len(data_lines))} linhas fazem match")

if __name__ == "__main__":
    test_lines()
