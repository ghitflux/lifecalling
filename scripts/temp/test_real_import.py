"""
Teste real de importação simulando a API
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "apps" / "api"))

from app.services.payroll_inetconsig_parser import parse_inetconsig_file, validate_inetconsig_content
from app.db import SessionLocal
from app.models import Client, Case, ImportBatch, PayrollLine
from collections import defaultdict

def test_real_import():
    """Simula importação completa"""

    file_path = Path(__file__).parent / "docs" / "Txt Retorno.txt"

    print("[*] Lendo arquivo completo...")
    with open(file_path, encoding="latin-1") as f:
        content = f.read()

    print(f"[*] Tamanho do arquivo: {len(content)} bytes")

    # Validar
    print("[*] Validando formato...")
    errors = validate_inetconsig_content(content)
    if errors:
        print(f"[ERRO] Validacao falhou: {errors}")
        return

    print("[OK] Formato valido")

    # Parse
    print("[*] Fazendo parse...")
    try:
        meta, lines, stats = parse_inetconsig_file(content)

        print(f"\n[OK] Parse concluido!")
        print(f"   Total linhas: {stats['total_lines']}")
        print(f"   Clientes unicos: {stats['unique_clients']}")

        if stats['total_lines'] == 0:
            print("\n[ERRO CRITICO] Nenhuma linha foi parseada!")
            return

        # Agrupar por cliente
        client_lines = defaultdict(list)
        for line in lines:
            key = (line["cpf"], line["matricula"])
            client_lines[key].append(line)

        print(f"\n[*] Clientes agrupados: {len(client_lines)}")

        # Mostrar primeiros 3 clientes
        print("\n== Primeiros 3 clientes ==")
        for i, ((cpf, matricula), client_lines_group) in enumerate(list(client_lines.items())[:3], 1):
            first_line = client_lines_group[0]
            print(f"\n   Cliente {i}:")
            print(f"      CPF: {cpf}")
            print(f"      Matricula: {matricula}")
            print(f"      Nome: {first_line['nome']}")
            print(f"      Total financiamentos: {len(client_lines_group)}")
            print(f"      FINs: {[l['financiamento_code'] for l in client_lines_group]}")

        # Testar conexão com banco
        print("\n[*] Testando conexao com banco...")
        db = SessionLocal()
        try:
            # Contar clientes existentes
            client_count = db.query(Client).count()
            case_count = db.query(Case).count()
            print(f"[OK] Banco conectado")
            print(f"   Clientes no banco: {client_count}")
            print(f"   Casos no banco: {case_count}")

            # Verificar se algum cliente do arquivo já existe
            sample_cpf = list(client_lines.keys())[0][0]
            existing = db.query(Client).filter(Client.cpf == sample_cpf).first()
            if existing:
                print(f"\n[INFO] Cliente exemplo {sample_cpf} JA EXISTE no banco")
            else:
                print(f"\n[INFO] Cliente exemplo {sample_cpf} NAO existe no banco")

        finally:
            db.close()

        print("\n[OK] Teste concluido - Arquivo pronto para importacao real!")

    except Exception as e:
        print(f"\n[ERRO] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_real_import()