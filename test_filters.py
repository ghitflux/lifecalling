#!/usr/bin/env python3
"""
Script para testar os filtros da esteira de atendimentos
"""

import requests
import json
import sys

# Configuração da API
API_BASE_URL = "http://localhost:8000"
LOGIN_URL = f"{API_BASE_URL}/auth/login"
CASES_URL = f"{API_BASE_URL}/cases"
FILTERS_URL = f"{API_BASE_URL}/clients/filters"

def login():
    """Faz login e retorna o token"""
    login_data = {
        "username": "admin@example.com",  # Substitua pelo usuário de teste
        "password": "admin123"  # Substitua pela senha de teste
    }
    
    response = requests.post(LOGIN_URL, json=login_data)
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"Erro no login: {response.status_code} - {response.text}")
        return None

def test_filters():
    """Testa a API de filtros"""
    token = login()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("=== Testando API de Filtros ===")
    response = requests.get(FILTERS_URL, headers=headers)
    if response.status_code == 200:
        filters = response.json()
        print(f"Filtros encontrados:")
        print(f"- Bancos: {len(filters.get('bancos', []))}")
        print(f"- Status: {len(filters.get('status', []))}")
        print(f"- Órgãos: {len(filters.get('orgaos', []))}")
        
        # Mostrar alguns bancos
        bancos = filters.get('bancos', [])
        if bancos:
            print(f"\nPrimeiros 5 bancos:")
            for banco in bancos[:5]:
                print(f"  - {banco['label']}: {banco['count']} casos")
        
        # Mostrar alguns status
        status = filters.get('status', [])
        if status:
            print(f"\nStatus disponíveis:")
            for s in status:
                print(f"  - {s['label']}: {s['count']} casos")
    else:
        print(f"Erro ao buscar filtros: {response.status_code} - {response.text}")

def test_cases_api():
    """Testa a API de casos com diferentes filtros"""
    token = login()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testando API de Casos ===")
    
    # Teste 1: Casos globais sem filtro
    print("\n1. Casos globais sem filtro:")
    response = requests.get(f"{CASES_URL}?page=1&page_size=10", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"  Total: {data.get('total', 0)} casos")
        print(f"  Items: {len(data.get('items', []))}")
    else:
        print(f"  Erro: {response.status_code} - {response.text}")
    
    # Teste 2: Casos globais com filtro de status
    print("\n2. Casos globais com filtro de status 'novo':")
    response = requests.get(f"{CASES_URL}?page=1&page_size=10&status=novo", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"  Total: {data.get('total', 0)} casos")
        print(f"  Items: {len(data.get('items', []))}")
    else:
        print(f"  Erro: {response.status_code} - {response.text}")
    
    # Teste 3: Casos globais com filtro de banco
    print("\n3. Casos globais com filtro de banco (primeiro banco disponível):")
    filters_response = requests.get(FILTERS_URL, headers=headers)
    if filters_response.status_code == 200:
        filters = filters_response.json()
        bancos = filters.get('bancos', [])
        if bancos:
            primeiro_banco = bancos[0]['value']
            response = requests.get(f"{CASES_URL}?page=1&page_size=10&entity={primeiro_banco}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"  Banco: {primeiro_banco}")
                print(f"  Total: {data.get('total', 0)} casos")
                print(f"  Items: {len(data.get('items', []))}")
            else:
                print(f"  Erro: {response.status_code} - {response.text}")
    
    # Teste 4: Casos globais com busca
    print("\n4. Casos globais com busca 'test':")
    response = requests.get(f"{CASES_URL}?page=1&page_size=10&q=test", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"  Total: {data.get('total', 0)} casos")
        print(f"  Items: {len(data.get('items', []))}")
    else:
        print(f"  Erro: {response.status_code} - {response.text}")
    
    # Teste 5: Meus casos
    print("\n5. Meus casos:")
    response = requests.get(f"{CASES_URL}?page=1&page_size=10&mine=true", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print(f"  Total: {data.get('total', 0)} casos")
        print(f"  Items: {len(data.get('items', []))}")
    else:
        print(f"  Erro: {response.status_code} - {response.text}")

if __name__ == "__main__":
    print("Testando filtros da esteira de atendimentos...")
    test_filters()
    test_cases_api()
    print("\nTeste concluído!")
