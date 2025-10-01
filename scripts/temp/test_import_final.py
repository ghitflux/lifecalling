"""
Teste final de importação via API
"""
import requests
from pathlib import Path
import json

API_URL = "http://localhost:8000"

# Usar arquivo de teste menor
FILE_PATH = Path(__file__).parent / "teste_pequeno_100linhas.txt"

if not FILE_PATH.exists():
    print(f"[ERRO] Arquivo não encontrado: {FILE_PATH}")
    exit(1)

print(f"[*] Arquivo de teste: {FILE_PATH}")
print(f"[*] Tamanho: {FILE_PATH.stat().st_size} bytes")

# Login
print("\n[*] Fazendo login...")
try:
    login_response = requests.post(
        f"{API_URL}/login",
        json={"email": "admin@lifecalling.com", "password": "admin123"},
        timeout=10
    )

    if login_response.status_code != 200:
        print(f"[ERRO] Login falhou: {login_response.status_code}")
        print(login_response.text)
        exit(1)

    token = login_response.json()["token"]
    print(f"[OK] Token obtido")

except Exception as e:
    print(f"[ERRO] Falha no login: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Upload
print(f"\n[*] Enviando arquivo para importação...")
try:
    with open(FILE_PATH, "rb") as f:
        files = {"file": (FILE_PATH.name, f, "text/plain")}

        response = requests.post(
            f"{API_URL}/imports",
            headers=headers,
            files=files,
            timeout=60
        )

    print(f"\n[*] Status code: {response.status_code}")

    if response.status_code != 200:
        print(f"\n[ERRO] Importação falhou!")
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.text[:500]}")
        exit(1)

    result = response.json()

    print(f"\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
    print(f"\n== Resumo ==")
    print(json.dumps(result, indent=2))

    # Buscar casos
    print(f"\n[*] Buscando casos criados...")
    cases_response = requests.get(
        f"{API_URL}/cases",
        headers=headers,
        timeout=10
    )

    if cases_response.status_code == 200:
        cases_data = cases_response.json()
        print(f"\n[OK] Casos encontrados: {len(cases_data.get('cases', []))}")

    print(f"\n✅ TESTE CONCLUÍDO COM SUCESSO!")

except Exception as e:
    print(f"\n[ERRO] Exceção durante importação: {e}")
    import traceback
    traceback.print_exc()
    exit(1)