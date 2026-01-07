"""
Script para testar o endpoint /auth/forgot-password
"""
import requests
from dotenv import load_dotenv

load_dotenv(".env.local")

# API URL
API_URL = "http://localhost:8000"

def test_forgot_password():
    """Testa o endpoint de forgot-password"""

    print("=" * 60)
    print("Testando endpoint /auth/forgot-password")
    print("=" * 60)

    # E-mail de teste (deve existir no banco)
    test_email = "admin@lifeservicos.com"

    print(f"\n1. Enviando solicitação para: {test_email}")

    response = requests.post(
        f"{API_URL}/auth/forgot-password",
        json={"email": test_email}
    )

    print(f"\n2. Response Status: {response.status_code}")
    print(f"3. Response Body: {response.json()}")

    if response.status_code == 200:
        print("\n✅ SUCCESS: Endpoint funcionando corretamente!")
        print("   Verifique o e-mail para o link de recuperação.")

        # Verificar se token foi criado no banco
        from app.db import SessionLocal
        from app.models import PasswordResetToken, User

        with SessionLocal() as db:
            user = db.query(User).filter(User.email == test_email).first()
            if user:
                token = db.query(PasswordResetToken).filter(
                    PasswordResetToken.user_id == user.id,
                    PasswordResetToken.used == False
                ).first()

                if token:
                    print(f"\n4. Token gerado: {token.token[:20]}...")
                    print(f"   Expira em: {token.expires_at}")
                    print(f"   Usado: {token.used}")
                else:
                    print("\n⚠️  Nenhum token encontrado no banco")
            else:
                print("\n⚠️  Usuário não encontrado")
    else:
        print("\n❌ ERROR: Falha ao enviar solicitação")
        print(f"   Detalhe: {response.text}")

if __name__ == "__main__":
    test_forgot_password()
