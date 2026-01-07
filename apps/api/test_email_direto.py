"""
Teste direto de envio de e-mail para helciovenancio10@gmail.com
"""
from dotenv import load_dotenv
load_dotenv(".env.local")

from app.services.email_service import email_service

print("=" * 60)
print("Teste de envio de e-mail para helciovenancio10@gmail.com")
print("=" * 60)

print("\nConfiguracoes SMTP:")
print(f"  Host: {email_service.smtp_host}")
print(f"  Port: {email_service.smtp_port}")
print(f"  User: {email_service.smtp_user}")
print(f"  Use SSL: {email_service.use_ssl}")

print("\nEnviando e-mail de teste...")

success = email_service.send_password_reset_email(
    to_email="helciovenancio10@gmail.com",
    user_name="Helcio",
    reset_link="http://192.168.3.8:3000/reset-password?token=TESTE123"
)

if success:
    print("\n[OK] E-mail enviado com sucesso!")
    print("Verifique a caixa de entrada e SPAM de helciovenancio10@gmail.com")
else:
    print("\n[ERROR] Falha ao enviar e-mail")
