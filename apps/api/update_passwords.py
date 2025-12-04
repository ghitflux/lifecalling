"""
Script para atualizar senhas dos usuários do sistema.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models import User
from app.security import hash_password

# Lista de usuários e suas novas senhas
USERS_PASSWORDS = [
    ("admin@lifecalling.com", "Admin@2025"),
    ("calc2@lifecalling.com", "Calc2@2025"),
    ("fechamento@lifecalling.com", "Fechamento@2025"),
    ("calculista@lifecalling.com", "Calculista@2025"),
    ("atendente1@lifecalling.com", "Atend1@2025"),
    ("atendente2@lifecalling.com", "Atend2@2025"),
    ("atendente3@lifecalling.com", "Atend3@2025"),
    ("atendente4@lifecalling.com", "Atend4@2025"),
    ("atendente5@lifecalling.com", "Atend5@2025"),
    ("atendente6@lifecalling.com", "Atend6@2025"),
    ("atendente7@lifecalling.com", "Atend7@2025"),
    ("financeiro@lifecalling.com", "Financeiro@2025"),
    ("atendente8@lifecalling.com", "Atend8@2025"),
    ("balcao@lifecalling.com", "Balcao@2025"),
    ("carolinda33.11@gmail.com", "Carolinda@2025"),
    ("flaviamacedoc@hotmail.com", "Flavia@2025"),
    ("peltson@gmail.com", "Peltson@2025"),
    ("phb@lifecalling.com", "PHB@2025"),
    ("wfws@gmail.com", "WFWS@2025"),
]

def main():
    print("=" * 60)
    print("ATUALIZANDO SENHAS DOS USUÁRIOS")
    print("=" * 60)

    db = SessionLocal()

    try:
        updated_count = 0
        not_found_count = 0

        for email, password in USERS_PASSWORDS:
            user = db.query(User).filter(User.email == email).first()

            if user:
                # Atualizar senha
                user.password_hash = hash_password(password)

                # Garantir que o usuário está ativo
                if not user.active:
                    user.active = True
                    print(f"[OK] {email:40} - Senha atualizada e ATIVADO")
                else:
                    print(f"[OK] {email:40} - Senha atualizada")

                updated_count += 1
            else:
                print(f"[X] {email:40} - Usuario NAO ENCONTRADO")
                not_found_count += 1

        # Commit das alterações
        db.commit()

        print("=" * 60)
        print(f"RESUMO:")
        print(f"  Senhas atualizadas: {updated_count}")
        print(f"  Usuários não encontrados: {not_found_count}")
        print("=" * 60)

        if updated_count > 0:
            print("\n[OK] Senhas atualizadas com sucesso!")
            print("\nTeste agora com qualquer uma das credenciais:")
            print("  Email: admin@lifecalling.com")
            print("  Senha: Admin@2025")

    except Exception as e:
        print(f"\n[ERRO] {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
