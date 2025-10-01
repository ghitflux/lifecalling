import re

def analyze_layout():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    lines = content.splitlines()
    
    # Buscar a linha de cabeçalho
    header_line = None
    for i, line in enumerate(lines):
        if 'STATUS' in line and 'MATRICULA' in line and 'CPF' in line:
            header_line = line
            print(f"Header encontrado na linha {i+1}: {repr(line)}")
            break
    
    if not header_line:
        print("Header não encontrado")
        return
    
    # Buscar primeira linha de dados
    data_line = None
    for line in lines:
        if re.match(r'^\s*[1-6S]\s+', line):
            data_line = line
            break
    
    if data_line:
        print(f"\nPrimeira linha de dados: {repr(data_line)}")
        print(f"Tamanho: {len(data_line)} caracteres")
        
        # Mapear posições
        print("\nAnálise de posições:")
        print("Pos: 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890")
        print(f"Dat: {data_line[:90]}")
        
        # Encontrar campos separados por espaços múltiplos
        parts = re.split(r'\s{2,}', data_line.strip())
        print(f"\nPartes separadas: {len(parts)}")
        for i, part in enumerate(parts):
            print(f"{i}: {repr(part)}")

if __name__ == "__main__":
    analyze_layout()
