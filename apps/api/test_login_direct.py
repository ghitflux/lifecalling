"""
Testa login direto via HTTP
"""
import requests
import json

def test_backend_health():
    """Testa se backend está respondendo"""
    print("\n" + "="*60)
    print("1. TESTANDO HEALTH CHECK")
    print("="*60)

    try:
        response = requests.get("http://localhost:8000/health", timeout=3)
        print(f"✅ Backend ONLINE")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT - Backend não responde em 3 segundos")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Backend não está rodando!")
        print("\n🔧 SOLUÇÃO:")
        print("   cd apps/api")
        print("   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return False
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        return False

def test_login():
    """Testa login com credenciais"""
    print("\n" + "="*60)
    print("2. TESTANDO LOGIN")
    print("="*60)

    url = "http://localhost:8000/auth/login"
    credentials = {
        "email": "admin@lifecalling.com",
        "password": "admin123"
    }

    print(f"URL: {url}")
    print(f"Email: {credentials['email']}")
    print(f"Senha: {credentials['password']}")

    try:
        response = requests.post(
            url,
            json=credentials,
            timeout=5,
            headers={"Content-Type": "application/json"}
        )

        print(f"\n📊 Resultado:")
        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            print(f"   ✅ LOGIN SUCESSO!")
            data = response.json()
            print(f"   User ID: {data.get('id')}")
            print(f"   Nome: {data.get('name')}")
            print(f"   Role: {data.get('role')}")
            print(f"   Email: {data.get('email')}")

            # Verificar cookies
            cookies = response.cookies
            print(f"\n🍪 Cookies recebidos:")
            print(f"   access: {'SIM' if 'access' in cookies else 'NÃO'}")
            print(f"   refresh: {'SIM' if 'refresh' in cookies else 'NÃO'}")
            print(f"   role: {'SIM' if 'role' in cookies else 'NÃO'}")

            return True
        else:
            print(f"   ❌ LOGIN FALHOU!")
            print(f"   Resposta: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("❌ TIMEOUT - Login demorou mais de 5 segundos")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ CONNECTION ERROR - Backend não está rodando!")
        return False
    except Exception as e:
        print(f"❌ ERRO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("="*60)
    print("TESTE COMPLETO DE LOGIN")
    print("="*60)

    # Teste 1: Health check
    if not test_backend_health():
        print("\n⛔ Backend não está rodando. Inicie primeiro!")
        return False

    # Teste 2: Login
    if not test_login():
        print("\n⛔ Login falhou!")
        return False

    print("\n" + "="*60)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("="*60)
    print("\n✨ Agora teste no frontend:")
    print("   http://localhost:3000/login")
    print("   Email: admin@lifecalling.com")
    print("   Senha: admin123")

    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
