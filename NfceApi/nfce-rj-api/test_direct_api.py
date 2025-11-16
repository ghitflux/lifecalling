#!/usr/bin/env python3
"""
Script para testar diretamente os endpoints da API NFCe
"""
import subprocess
import json
import sys

def run_curl_command(url, description):
    """Executa um comando curl e retorna o resultado"""
    print(f"\n{description}")
    print("=" * 60)
    print(f"URL: {url}")
    print("-" * 60)
    
    try:
        # Usar PowerShell Invoke-WebRequest em vez de curl no Windows
        cmd = [
            "powershell", "-Command", 
            f"try {{ $response = Invoke-WebRequest -Uri '{url}' -TimeoutSec 30; Write-Host 'Status:' $response.StatusCode; Write-Host 'Content-Type:' $response.Headers['Content-Type']; Write-Host ''; $response.Content }} catch {{ Write-Host 'Erro:' $_.Exception.Message }}"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print(f"Erro na execução: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print("Timeout: A requisição demorou mais de 35 segundos")
    except Exception as e:
        print(f"Erro inesperado: {e}")

def main():
    """Função principal para testar a API"""
    
    base_url = "http://localhost:8000"
    test_url = "https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=33250901829249000177651010005539591306875555|2|1|1|E1F680232ED4077DA8625F4168EB3D3ED2085E42"
    
    print("TESTE DA API NFCe - ENDPOINTS REAIS")
    print("=" * 60)
    
    # Teste 1: Health Check
    health_url = f"{base_url}/health"
    run_curl_command(health_url, "1. TESTE DO HEALTH CHECK")
    
    # Teste 2: Debug endpoint
    debug_url = f"{base_url}/api/nfce/rj/debug?url={test_url}&show_html=false"
    run_curl_command(debug_url, "2. TESTE DO ENDPOINT DEBUG (sem HTML)")
    
    # Teste 3: API JSON
    json_url = f"{base_url}/api/nfce/rj?url={test_url}&out=json"
    run_curl_command(json_url, "3. TESTE DA API - RESPOSTA JSON")
    
    # Teste 4: API XML
    xml_url = f"{base_url}/api/nfce/rj?url={test_url}&out=xml"
    run_curl_command(xml_url, "4. TESTE DA API - RESPOSTA XML")
    
    print("\n" + "=" * 60)
    print("TESTES CONCLUÍDOS")
    print("=" * 60)

if __name__ == "__main__":
    main()