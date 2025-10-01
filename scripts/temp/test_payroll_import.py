import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'api'))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file, STATUS_LEGEND

def test_import():
    with open('docs/Txt Retorno.txt', 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    print("=== TESTE COMPLETO DE IMPORTAÇÃO ===")
    
    try:
        meta, lines, stats = parse_inetconsig_file(content)
        print(f"✓ Parse realizado com sucesso!")
        print(f"  Entidade: {meta['entity_code']}-{meta['entity_name']}")
        print(f"  Referência: {meta['ref_month']:02d}/{meta['ref_year']}")
        print(f"  Linhas processadas: {len(lines)}")
        print(f"  Estatísticas: {stats}")
        
        if lines:
            print(f"\nPrimeira linha processada:")
            first = lines[0]
            print(f"  CPF: {first['cpf']}")
            print(f"  Nome: {first['nome']}")
            print(f"  Matrícula: {first['matricula']}")
            print(f"  Status: {first['status_code']} - {first['status_description']}")
            print(f"  FIN: {first['financiamento_code']}")
            print(f"  Valor: {first['valor_parcela_ref']}")
            
        print("\n=== SUCESSO ===")
        return True
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_import()
