"""
Serviço de envio de e-mails para o sistema Life
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional


class EmailService:
    """Serviço para envio de e-mails via SMTP"""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "Life Serviços")
        self.use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Envia um e-mail via SMTP

        Args:
            to_email: E-mail do destinatário
            subject: Assunto do e-mail
            html_body: Corpo do e-mail em HTML
            text_body: Corpo do e-mail em texto plano (opcional)

        Returns:
            bool: True se enviado com sucesso, False caso contrário
        """
        try:
            # Criar mensagem
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email

            # Adicionar corpo em texto plano
            if text_body:
                part1 = MIMEText(text_body, 'plain', 'utf-8')
                msg.attach(part1)

            # Adicionar corpo em HTML
            part2 = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part2)

            # Conectar ao servidor SMTP e enviar
            if self.use_ssl or self.smtp_port == 465:
                # Usar SMTP_SSL para porta 465 (Hostinger, etc)
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                # Usar SMTP com STARTTLS para porta 587 (Gmail, etc)
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)

            print(f"[EmailService] E-mail enviado com sucesso para {to_email}")
            return True

        except Exception as e:
            print(f"[EmailService] Erro ao enviar e-mail: {str(e)}")
            return False

    def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_link: str
    ) -> bool:
        """
        Envia e-mail de recuperação de senha

        Args:
            to_email: E-mail do destinatário
            user_name: Nome do usuário
            reset_link: Link de recuperação de senha

        Returns:
            bool: True se enviado com sucesso
        """
        subject = "Recuperação de Senha - Life Serviços"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333333;
            margin-bottom: 20px;
        }}
        .message {{
            font-size: 15px;
            color: #666666;
            line-height: 1.6;
            margin-bottom: 30px;
        }}
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .button {{
            display: inline-block;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }}
        .warning {{
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400E;
        }}
        .footer {{
            background-color: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            font-size: 13px;
            color: #9ca3af;
        }}
        .link {{
            color: #10b981;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
        </div>
        <div class="content">
            <div class="greeting">
                Olá, <strong>{user_name}</strong>!
            </div>
            <div class="message">
                Recebemos uma solicitação para redefinir a senha da sua conta no Life Serviços.
                Se você não fez esta solicitação, pode ignorar este e-mail com segurança.
            </div>
            <div class="button-container">
                <a href="{reset_link}" class="button">
                    Redefinir Minha Senha
                </a>
            </div>
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este link expira em <strong>24 horas</strong></li>
                    <li>Nunca compartilhe este link com outras pessoas</li>
                    <li>Se você não solicitou, ignore este e-mail</li>
                </ul>
            </div>
            <div class="message" style="margin-top: 30px;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
                <br>
                <a href="{reset_link}" class="link">{reset_link}</a>
            </div>
        </div>
        <div class="footer">
            <p>
                Este é um e-mail automático, por favor não responda.<br>
                © 2025 Life Serviços - Todos os direitos reservados
            </p>
        </div>
    </div>
</body>
</html>
"""

        text_body = f"""
Olá, {user_name}!

Recebemos uma solicitação para redefinir a senha da sua conta no Life Serviços.

Para redefinir sua senha, acesse o link abaixo:
{reset_link}

IMPORTANTE:
- Este link expira em 24 horas
- Nunca compartilhe este link com outras pessoas
- Se você não solicitou, ignore este e-mail

---
© 2025 Life Serviços
"""

        return self.send_email(to_email, subject, html_body, text_body)


# Instância global do serviço
email_service = EmailService()
