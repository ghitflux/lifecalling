import re

def find_positions():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    lines = content.splitlines()
    
    # Buscar algumas linhas de dados
    data_lines = []
    for line in lines:
        if re.match(r'^\s*[1-6S]\s+', line):
            data_lines.append(line)
            if len(data_lines) >= 3:
                break
    
    print("=== ANÁLISE DE POSIÇÕES EXATAS ===")
    for i, line in enumerate(data_lines):
        print(f"\nLinha {i+1}: {repr(line)}")
        print("Posições: 0         1         2         3         4         5         6         7         8         9         10        11        12        13        14")
        print("         0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234")
        print(f"Conteudo: {line}")
        
        # Procurar campos específicos
        # STATUS - posição 0-2
        # MATRICULA - em torno de 6-15  
        # NOME+CARGO - em torno de 18-78
        # FIN - em torno de 80-85
        # ORGAO - em torno de 90-95
        # LANC - depois
        # TOTAL - depois
        # PAGO - depois  
        # VALOR - depois
        # ORGAO_PAGTO - depois
        # CPF - final (11 dígitos)
        
        print(f"CPF final: {line[-11:]}")

if __name__ == "__main__":
    find_positions()
