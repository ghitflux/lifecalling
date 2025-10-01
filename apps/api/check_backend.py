"""
Verifica se o backend está rodando
"""
import requests
import subprocess
import sys

def check_port_8000():
    """Verifica se a porta 8000 está em uso"""
    print("\n[CHECK] Verificando porta 8000...")

    try:
        result = subprocess.run(
            ["netstat", "-ano"],
            capture_output=True,
            text=True,
            timeout=5
        )

        lines = result.stdout.split('\n')
        port_8000_lines = [line for line in lines if ':8000' in line]

        if port_8000_lines:
            print("[OK] Porta 8000 esta em uso:")
            for line in port_8000_lines[:3]:  # Mostrar apenas primeiras 3 linhas
                print(f"   {line.strip()}")
            return True
        else:
            print("[X] Porta 8000 NAO esta em uso")
            print("   Backend provavelmente nao esta rodando")
            return False

    except subprocess.TimeoutExpired:
        print("[!] Timeout ao verificar porta")
        return False
    except Exception as e:
        print(f"[!] Erro ao verificar porta: {str(e)}")
        return False

def check_backend_health():
    """Verifica se o backend responde"""
    print("\n[CHECK] Testando health check...")

    try:
        response = requests.get("http://localhost:8000/health", timeout=3)
        if response.status_code == 200:
            print("[OK] Backend esta ONLINE e respondendo!")
            print(f"   Resposta: {response.json()}")
            return True
        else:
            print(f"[!] Backend respondeu com status {response.status_code}")
            return False

    except requests.exceptions.Timeout:
        print("[X] TIMEOUT - Backend nao responde")
        return False
    except requests.exceptions.ConnectionError:
        print("[X] CONNECTION ERROR - Backend nao esta rodando")
        return False
    except Exception as e:
        print(f"[X] Erro: {str(e)}")
        return False

def main():
    print("="*60)
    print("VERIFICAÇÃO DO BACKEND")
    print("="*60)

    port_ok = check_port_8000()
    health_ok = check_backend_health()

    print("\n" + "="*60)
    print("RESUMO")
    print("="*60)
    print(f"Porta 8000 em uso: {'[OK] SIM' if port_ok else '[X] NAO'}")
    print(f"Backend respondendo: {'[OK] SIM' if health_ok else '[X] NAO'}")

    if not health_ok:
        print("\n[SOLUCAO]:")
        print("="*60)
        print("1. Vá para o diretório da API:")
        print("   cd D:\\apps\\trae\\lifecallingv1\\lifecalling\\apps\\api")
        print("\n2. Inicie o backend:")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        print("\nOu use o script start_backend.bat")
        return False

    print("\n[OK] Backend esta funcionando corretamente!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
