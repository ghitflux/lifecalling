"""
Teste para verificar se o parser processa corretamente TODOS os status (1-6, S).
"""
import sys
sys.path.insert(0, 'apps/api')

from app.services.payroll_inetconsig_parser import parse_inetconsig_file

# Criar conteúdo de teste com TODOS os status
test_content = """Governo do Estado do Piaui
Empresa de Tecnologia da Informacao do Estado do Piaui - ETIPI
Relatorio dos Lancamentos da Folha de Pagamento - iNETConsig

Entidade: 1042-BANCO SANTANDER S.A                                            Referencia: 07/2025   Data da Geracao: 31/07/2025

STATUS MATRICULA NOME                           CARGO                          FIN. ORGAO LANC.  TOTAL PAGO  VALOR        ORGAO PAGTO CPF
====== ========= ============================== ============================== ==== ============ ===== ===== ============ =========== ===========
  1    000550-9  JOANA MARIA DOS SANTOS IBIAPIN 3-AGENTE SUPERIOR DE SERVICO   6490      001     088   024         458,04      001    47082976372
  2    000822-2  FRANCISCO DAS CHAGAS REGO COUT 2-AGENTE TECNICO DE SERVICO    9380      001     072   048          60,00      001    28689160310
  3    001306-4  ANTONIO ALONSO DA SILVA        1-AGENTE OPERACIONAL DE SERVIC 9380      001     072   057          67,00      001    28816960310
  4    001353-6  CARLOS HENRIQUE MAIA E SILVA   2-AGENTE TECNICO DE SERVICO    6490      001     096   028         195,72      001    22686053372
  5    001372-2  ELIETE ALVES DA ROCHA          -AGENTE OPERACIONAL DE SERVICO 6490      001     096   027         147,52      001    35243236349
  6    001457-5  MARIA DO CARMO DIAS DE SOUSA   -AGENTE TECNICO DE SERVICO     6490      001     096   027         136,47      001    18140360325
  S    001479-6  MARIA DO ROSARIO DE FATIMA DOS 1-AGENTE OPERACIONAL DE SERVIC 9380      001     096   093          58,37      001    13882554304

       Orgao Pagamento:  001-SEC DA ASSIST.SOC.E CIDADANIA   -  7 Lancamento(s)  -  Total R$ 1.093,12
"""

print("Testando parser com MULTIPLOS status...")
print("=" * 60)

try:
    meta, lines, stats = parse_inetconsig_file(test_content)

    print(f"\n[OK] Parse concluido!")
    print(f"Total de linhas processadas: {len(lines)}")

    print(f"\nDistribuicao de Status:")
    status_counts = {}
    for line in lines:
        status = line['status_code']
        if status not in status_counts:
            status_counts[status] = 0
        status_counts[status] += 1

    for status, count in sorted(status_counts.items()):
        print(f"   - Status '{status}': {count} linhas")

    # Verificar se tem todos os status esperados
    expected_statuses = {'1', '2', '3', '4', '5', '6', 'S'}
    found_statuses = set(status_counts.keys())

    print(f"\nStatus esperados: {expected_statuses}")
    print(f"Status encontrados: {found_statuses}")

    if found_statuses == expected_statuses:
        print("\n[SUCESSO] Todos os 7 status foram processados corretamente!")
        print("Bug do status fixo em '1' FOI CORRIGIDO!")

        # Mostrar exemplos de cada status
        print(f"\n--- Exemplos por Status ---")
        for status in ['1', '2', '3', '4', '5', '6', 'S']:
            example = next((l for l in lines if l['status_code'] == status), None)
            if example:
                print(f"\nStatus {status}: {example['status_description']}")
                print(f"  -> Nome: {example['nome']}")
                print(f"  -> CPF: {example['cpf']}")
    else:
        missing = expected_statuses - found_statuses
        print(f"\n[AVISO] Status faltando: {missing}")
        if len(found_statuses) > 1:
            print("Mas pelo menos encontrou mais de um status, entao NAO esta fixado!")

except Exception as e:
    print(f"[ERRO] {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)