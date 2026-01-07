"""
Script para testar o fluxo de forgot-password SEM servidor rodando
Testa as funções diretamente
"""
from dotenv import load_dotenv
load_dotenv(".env.local")

from app.db import SessionLocal
from app.models import User, PasswordResetToken
from app.services.email_service import email_service
import secrets
from datetime import datetime, timedelta
import os

def test_forgot_password_flow():
    """Testa o fluxo completo de recuperação de senha"""

    print("=" * 60)
    print("Testando fluxo de recuperação de senha (offline)")
    print("=" * 60)

    test_email = "admin@lifeservicos.com"

    with SessionLocal() as db:
        # 1. Buscar usuário
        print(f"\n1. Buscando usuário: {test_email}")
        user = db.query(User).filter(User.email == test_email).first()

        if not user:
            print(f"   [ERROR] Usuario nao encontrado")
            return

        print(f"   [OK] Usuario encontrado: {user.name} (ID: {user.id})")

        # 2. Invalidar tokens anteriores
        print(f"\n2. Invalidando tokens anteriores...")
        updated = db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used == False
        ).update({"used": True})
        db.commit()
        print(f"   [OK] {updated} tokens invalidados")

        # 3. Gerar novo token
        print(f"\n3. Gerando novo token...")
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at
        )
        db.add(reset_token)
        db.commit()
        print(f"   [OK] Token gerado: {token[:20]}...")
        print(f"   Expira em: {expires_at}")

        # 4. Gerar link de recuperação
        print(f"\n4. Gerando link de recuperacao...")
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{frontend_url}/reset-password?token={token}"
        print(f"   Link: {reset_link}")

        # 5. Enviar e-mail (REAL)
        print(f"\n5. Enviando e-mail...")
        print(f"   Destinatario: {user.email}")
        print(f"   Nome: {user.name}")

        success = email_service.send_password_reset_email(
            to_email=user.email,
            user_name=user.name,
            reset_link=reset_link
        )

        if success:
            print(f"   [OK] E-mail enviado com sucesso!")
        else:
            print(f"   [ERROR] Falha ao enviar e-mail")

    print("\n" + "=" * 60)
    print("Teste completo!")
    print("=" * 60)
    print(f"\nVerifique a caixa de entrada de: {test_email}")
    print(f"Link de reset: {reset_link}")

if __name__ == "__main__":
    test_forgot_password_flow()
