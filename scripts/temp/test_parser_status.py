"""
Script de teste para validar o parser de folha iNETConsig.
Testa especialmente se os status estão sendo corretamente extraídos.
"""
import sys
sys.path.insert(0, 'apps/api')

from app.services.payroll_inetconsig_parser import parse_inetconsig_file

# Ler arquivo de teste
with open('docs/Txt Retorno.txt', 'r', encoding='latin-1') as f:
    content = f.read()

print("Testando parser iNETConsig...")
print("=" * 60)

try:
    # Parse do arquivo
    meta, lines, stats = parse_inetconsig_file(content)

    print(f"\n[OK] Parse concluido com sucesso!")
    print(f"Estatisticas:")
    print(f"   - Total de linhas: {stats['total_lines']}")
    print(f"   - Clientes unicos: {stats['unique_clients']}")
    print(f"   - CPFs unicos: {stats['unique_cpfs']}")
    print(f"   - Entidade: {stats['entity']}")
    print(f"   - Referencia: {stats['reference']}")

    print(f"\nDistribuicao de Status:")
    for status, info in stats['status_distribution'].items():
        print(f"   - Status {status}: {info['count']} linhas")
        print(f"     -> {info['description']}")

    # Verificar se há variedade de status (NÃO apenas "1")
    unique_statuses = set(line['status_code'] for line in lines)
    print(f"\nStatus unicos encontrados: {unique_statuses}")

    if len(unique_statuses) == 1 and '1' in unique_statuses:
        print("[ERRO] Todos os status sao '1' (bug nao corrigido)")
        sys.exit(1)
    else:
        print("[SUCESSO] Status variados encontrados (bug corrigido)")

    # Mostrar exemplos
    print(f"\nExemplos de linhas processadas:")
    for i, line in enumerate(lines[:5]):
        print(f"\n   Linha {i+1}:")
        print(f"   - Nome: {line['nome']}")
        print(f"   - CPF: {line['cpf']}")
        print(f"   - Matrícula: {line['matricula']}")
        print(f"   - Status: {line['status_code']} - {line['status_description']}")
        print(f"   - FIN: {line['financiamento_code']}")
        print(f"   - Total/Pago: {line['total_parcelas']}/{line['parcelas_pagas']}")
        print(f"   - Valor: R$ {line['valor_parcela_ref']}")
        print(f"   - Orgao Pgto: {line['orgao_pagamento']} - {line.get('orgao_pagamento_nome', 'N/A')}")

    print("\n" + "=" * 60)
    print("[OK] Todos os testes passaram!")

except Exception as e:
    print(f"[ERRO] Erro durante o teste: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)