#!/usr/bin/env python3
"""
Script para corrigir senhas corrompidas no banco de dados.
Regenera os hashes bcrypt corretamente.
"""
import sys
from pathlib import Path

# Adiciona o diretório pai ao path para importar módulos
sys.path.insert(0, str(Path(__file__).parent))

from app.db import SessionLocal
from app.models import User
from app.security import hash_password

def fix_passwords():
    """Corrige as senhas de todos os usuários com senhas personalizadas"""
    print("\n[FIX] Atualizando senhas dos usuários...")

    # Senhas específicas por email
    passwords_by_email = {
        "admin@lifecalling.com": "Admin@2025",
        "calc2@lifecalling.com": "Calc2@2025",
        "fechamento@lifecalling.com": "Fechamento@2025",
        "calculista@lifecalling.com": "Calculista@2025",
        "atendente1@lifecalling.com": "Atend1@2025",
        "atendente2@lifecalling.com": "Atend2@2025",
        "atendente3@lifecalling.com": "Atend3@2025",
        "atendente4@lifecalling.com": "Atend4@2025",
        "atendente5@lifecalling.com": "Atend5@2025",
        "atendente6@lifecalling.com": "Atend6@2025",
        "atendente7@lifecalling.com": "Atend7@2025",
        "financeiro@lifecalling.com": "Financeiro@2025",
        "atendente8@lifecalling.com": "Atend8@2025",
        "balcao@lifecalling.com": "Balcao@2025",
        "carolinda33.11@gmail.com": "Carolinda@2025",
        "flaviamacedoc@hotmail.com": "Flavia@2025",
        "peltson@gmail.com": "Peltson@2025",
        "phb@lifecalling.com": "PHB@2025",
        "vanessa@lifedigital.com": "Vanessa@2025",
        "wfws@gmail.com": "WFWS@2025",
        # Senha padrão para usuários não especificados
        "admin@lifeservicos.com": "Admin@2025"
    }

    with SessionLocal() as db:
        try:
            users = db.query(User).all()
            updated_count = 0

            for user in users:
                if user.email in passwords_by_email:
                    password = passwords_by_email[user.email]
                    new_hash = hash_password(password)
                    user.password_hash = new_hash
                    print(f"  [OK] Atualizado: {user.name} ({user.email})")
                    updated_count += 1
                else:
                    print(f"  [SKIP] Sem senha definida para: {user.name} ({user.email})")

            db.commit()
            print(f"\n[OK] {updated_count} senhas atualizadas com sucesso!")
            print("\n" + "="*70)
            print("CREDENCIAIS DE ACESSO ATUALIZADAS")
            print("="*70)
            print("\nPrincipais contas de acesso:")
            print("  - admin@lifecalling.com / Admin@2025")
            print("  - admin@lifeservicos.com / Admin@2025")
            print("  - calculista@lifecalling.com / Calculista@2025")
            print("  - financeiro@lifecalling.com / Financeiro@2025")
            print("  - balcao@lifecalling.com / Balcao@2025")
            print("\n" + "="*70)

        except Exception as e:
            db.rollback()
            print(f"[ERRO] Erro ao atualizar senhas: {e}")
            raise

if __name__ == "__main__":
    fix_passwords()
