#!/usr/bin/env python3
"""
Script de teste para demonstrar a API NFCe com dados simulados
"""
import requests
import json
from xml.dom import minidom

# URL base da API
BASE_URL = "http://localhost:8000"

def test_api_with_mock_data():
    """Testa a API com dados simulados baseados na NFCe real"""
    
    # Dados simulados baseados na NFCe real que encontramos
    mock_data = {
        "valor_total_br": "9,36",
        "valor_total": 9.36,
        "chave_acesso": "33250901829249000177651010005539591306875555",
        "qtd_itens": 2,
        "cnpj_emitente": "01.829.249/0001-77",
        "nome_emitente": "CEREAIS MARREQUINHO DE NOVA CAMPINAS LTDA",
        "endereco_emitente": "AVENIDA B, 480, LOJA, NOVA CAMPINAS, DUQUE DE CAXIAS, RJ",
        "itens": [
            {
                "descricao": "Oleo Soja Soya Pet 900",
                "codigo": "7891107101621",
                "quantidade": "1UN",
                "valor_unitario": 9.29,
                "valor_total": 9.29
            },
            {
                "descricao": "Sacola Plast Peq Re un",
                "codigo": "2",
                "quantidade": "1UN", 
                "valor_unitario": 0.07,
                "valor_total": 0.07
            }
        ],
        "forma_pagamento": "Dinheiro",
        "valor_pago": 10.00,
        "troco": 0.64
    }
    
    print("=== TESTE DA API NFCe - DADOS SIMULADOS ===\n")
    
    # Teste 1: Resposta JSON
    print("1. TESTANDO RESPOSTA JSON:")
    print("-" * 40)
    print(json.dumps(mock_data, indent=2, ensure_ascii=False))
    print()
    
    # Teste 2: Conversão para XML
    print("2. TESTANDO RESPOSTA XML:")
    print("-" * 40)
    
    # Simular conversão para XML
    xml_content = convert_to_xml(mock_data)
    print(xml_content)
    print()
    
    # Teste 3: Health check da API real
    print("3. TESTANDO HEALTH CHECK DA API:")
    print("-" * 40)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Erro ao conectar com a API: {e}")
    print()

def convert_to_xml(data):
    """Converte dados para formato XML"""
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_lines.append('<nfce>')
    
    # Dados básicos
    xml_lines.append(f'  <chave_acesso>{data.get("chave_acesso", "")}</chave_acesso>')
    xml_lines.append(f'  <valor_total>{data.get("valor_total", 0)}</valor_total>')
    xml_lines.append(f'  <valor_total_br>{data.get("valor_total_br", "")}</valor_total_br>')
    xml_lines.append(f'  <qtd_itens>{data.get("qtd_itens", 0)}</qtd_itens>')
    
    # Emitente
    xml_lines.append('  <emitente>')
    xml_lines.append(f'    <cnpj>{data.get("cnpj_emitente", "")}</cnpj>')
    xml_lines.append(f'    <nome>{data.get("nome_emitente", "")}</nome>')
    xml_lines.append(f'    <endereco>{data.get("endereco_emitente", "")}</endereco>')
    xml_lines.append('  </emitente>')
    
    # Itens
    xml_lines.append('  <itens>')
    for item in data.get("itens", []):
        xml_lines.append('    <item>')
        xml_lines.append(f'      <descricao>{item.get("descricao", "")}</descricao>')
        xml_lines.append(f'      <codigo>{item.get("codigo", "")}</codigo>')
        xml_lines.append(f'      <quantidade>{item.get("quantidade", "")}</quantidade>')
        xml_lines.append(f'      <valor_unitario>{item.get("valor_unitario", 0)}</valor_unitario>')
        xml_lines.append(f'      <valor_total>{item.get("valor_total", 0)}</valor_total>')
        xml_lines.append('    </item>')
    xml_lines.append('  </itens>')
    
    # Pagamento
    xml_lines.append('  <pagamento>')
    xml_lines.append(f'    <forma>{data.get("forma_pagamento", "")}</forma>')
    xml_lines.append(f'    <valor_pago>{data.get("valor_pago", 0)}</valor_pago>')
    xml_lines.append(f'    <troco>{data.get("troco", 0)}</troco>')
    xml_lines.append('  </pagamento>')
    
    xml_lines.append('</nfce>')
    
    return '\n'.join(xml_lines)

if __name__ == "__main__":
    test_api_with_mock_data()