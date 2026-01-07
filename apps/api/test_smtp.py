import os

from dotenv import load_dotenv

# Load .env.local so email_service picks up SMTP settings.
load_dotenv(".env.local")

from app.services.email_service import email_service


def main() -> None:
    to_email = os.getenv("SMTP_TEST_EMAIL", "").strip()
    if not to_email:
        print("Set SMTP_TEST_EMAIL to a real address before running this test.")
        return

    print("Testing SMTP configuration...")
    print(f"Host: {email_service.smtp_host}")
    print(f"Port: {email_service.smtp_port}")
    print(f"User: {email_service.smtp_user}")
    print(f"Use SSL: {email_service.use_ssl}")
    print()

    success = email_service.send_password_reset_email(
        to_email=to_email,
        user_name="Teste",
        reset_link="http://localhost:3000/reset-password?token=teste123",
    )

    if success:
        print("Email sent successfully. Check your inbox.")
    else:
        print("Failed to send email.")


if __name__ == "__main__":
    main()
