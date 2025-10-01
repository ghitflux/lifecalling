"""
Testa importação via API HTTP
"""
import requests
from pathlib import Path

# Configuração
API_URL = "http://localhost:8000"
FILE_PATH = Path(__file__).parent / "docs" / "Txt Retorno.txt"

# Login para obter token (ajustar credenciais conforme necessário)
print("[*] Fazendo login...")
login_response = requests.post(
    f"{API_URL}/login",
    json={"email": "admin@lifecalling.com", "password": "admin123"}
)

if login_response.status_code != 200:
    print(f"[ERRO] Login falhou: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["token"]
print(f"[OK] Token obtido")

headers = {"Authorization": f"Bearer {token}"}

# Fazer upload do arquivo
print(f"\n[*] Enviando arquivo para importação...")
print(f"[*] Arquivo: {FILE_PATH}")
print(f"[*] Tamanho: {FILE_PATH.stat().st_size / 1024 / 1024:.2f} MB")

with open(FILE_PATH, "rb") as f:
    files = {"file": (FILE_PATH.name, f, "text/plain")}

    response = requests.post(
        f"{API_URL}/imports",
        headers=headers,
        files=files,
        timeout=300  # 5 minutos de timeout
    )

if response.status_code != 200:
    print(f"\n[ERRO] Importação falhou: {response.status_code}")
    print(response.text[:500])
    exit(1)

# Resultado
result = response.json()
print(f"\n[OK] Importação concluída com sucesso!")
print(f"\n== Resumo ==")
print(f"   Batch ID: {result['batch_id']}")
print(f"\n== Contadores ==")
for key, value in result['counters'].items():
    print(f"   {key}: {value}")

print(f"\n== Parse Stats ==")
for key, value in result['parse_stats'].items():
    if key != 'status_distribution':
        print(f"   {key}: {value}")

print(f"\n== Metadata ==")
for key, value in result['metadata'].items():
    print(f"   {key}: {value}")

# Buscar casos criados
print(f"\n[*] Buscando casos criados...")
cases_response = requests.get(
    f"{API_URL}/cases",
    headers=headers,
    params={"limit": 5}
)

if cases_response.status_code == 200:
    cases = cases_response.json()
    print(f"\n[OK] Total de casos no sistema: {len(cases.get('cases', []))}")

    if cases.get('cases'):
        print(f"\n== Primeiros 3 casos ==")
        for i, case in enumerate(cases['cases'][:3], 1):
            print(f"\n   Caso {i}:")
            print(f"      ID: {case.get('id')}")
            print(f"      Cliente: {case.get('client_name', 'N/A')}")
            print(f"      CPF: {case.get('client_cpf', 'N/A')}")
            print(f"      Status: {case.get('status')}")
            print(f"      Entidade: {case.get('entidade', 'N/A')}")
else:
    print(f"[AVISO] Não foi possível buscar casos: {cases_response.status_code}")