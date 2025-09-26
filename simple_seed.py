#!/usr/bin/env python3
"""
Script simples para criar casos de teste via API REST
"""
import requests
import json

# Configurações
API_BASE = "http://localhost:8000"
LOGIN_DATA = {
    "email": "admin@demo.local",
    "password": "123456"
}

def get_auth_token():
    """Faz login e retorna o token de autenticação"""
    response = requests.post(f"{API_BASE}/auth/login", json=LOGIN_DATA)
    if response.status_code == 200:
        return response.cookies
    else:
        print(f"Erro no login: {response.status_code} - {response.text}")
        return None

def create_test_case(session, client_data, case_data):
    """Cria um cliente e caso de teste"""
    # Primeiro criar o cliente (assumindo que temos um endpoint para isso)
    # Como não temos endpoint de clientes, vamos apenas testar se conseguimos listar casos
    pass

def test_cases_endpoint(session):
    """Testa os endpoints de casos"""
    print("Testando endpoint /cases...")

    # Testar casos globais
    response = session.get(f"{API_BASE}/cases?assigned=0")
    print(f"GET /cases?assigned=0: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - {len(data.get('items', []))} casos nao atribuidos encontrados")

    # Testar meus casos
    response = session.get(f"{API_BASE}/cases?mine=true")
    print(f"GET /cases?mine=true: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - {len(data.get('items', []))} casos meus encontrados")

    # Testar todos os casos
    response = session.get(f"{API_BASE}/cases")
    print(f"GET /cases: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  - {len(data.get('items', []))} casos totais encontrados")

        # Mostrar alguns casos de exemplo
        items = data.get('items', [])
        if items:
            print("\nPrimeiros casos encontrados:")
            for i, case in enumerate(items[:3]):
                print(f"  {i+1}. ID: {case.get('id')}, Status: {case.get('status')}, Cliente: {case.get('client', {}).get('name', 'N/A')}")

def main():
    print("Testando sistema de casos Lifecalling...")

    # Criar sessão
    session = requests.Session()

    # Fazer login
    print("Fazendo login...")
    cookies = get_auth_token()
    if not cookies:
        print("ERRO: Falha no login")
        return

    # Configurar cookies na sessão
    session.cookies.update(cookies)
    print("Login realizado com sucesso")

    # Testar endpoints
    test_cases_endpoint(session)

    print("\nTeste concluido!")

if __name__ == "__main__":
    main()