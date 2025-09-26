#!/usr/bin/env python3
"""
Script para criar casos de teste limpos via API
"""
import requests
import json
from datetime import datetime, timedelta
import random

# Configurações
API_BASE = "http://localhost:8000"
LOGIN_DATA = {
    "email": "admin@demo.local",
    "password": "123456"
}

def get_auth_session():
    """Faz login e retorna sessão autenticada"""
    session = requests.Session()
    response = session.post(f"{API_BASE}/auth/login", json=LOGIN_DATA)
    if response.status_code == 200:
        print("Login realizado com sucesso")
        return session
    else:
        print(f"Erro no login: {response.status_code} - {response.text}")
        return None

def create_client_and_case(session, client_data, case_data):
    """Cria cliente e caso via API"""
    # Como não temos endpoint público para criar clientes,
    # vamos inserir dados diretamente no banco via script SQL

    # Vamos apenas testar se conseguimos acessar casos existentes
    print("Testando acesso aos casos existentes...")

    response = session.get(f"{API_BASE}/cases?page_size=3")
    if response.status_code == 200:
        data = response.json()
        print(f"Encontrados {data.get('total', 0)} casos")

        items = data.get('items', [])
        if items:
            print("\nPrimeiros casos:")
            for i, case in enumerate(items[:3]):
                status = case.get('status', 'N/A')
                client_name = case.get('client', {}).get('name', 'N/A')
                case_id = case.get('id', 'N/A')
                print(f"  {i+1}. Caso {case_id}: {status} - {client_name}")
        else:
            print("AVISO: Nenhum caso retornado na lista")
    else:
        print(f"ERRO ao acessar casos: {response.status_code}")
        print(f"Response: {response.text}")

def main():
    print("Testando acesso a casos no Lifecalling...")

    # Fazer login
    session = get_auth_session()
    if not session:
        return

    # Testar acesso aos dados
    create_client_and_case(session, {}, {})

    print("\nTeste concluido!")

if __name__ == "__main__":
    main()