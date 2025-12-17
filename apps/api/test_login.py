"""
Teste simples de login para debug
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models import User
from app.security import verify_password

def test_login(email, password):
    print(f"\n{'='*60}")
    print(f"TESTANDO LOGIN: {email}")
    print(f"{'='*60}")

    db = SessionLocal()

    try:
        # Buscar usuário
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"[X] Usuario NAO ENCONTRADO: {email}")
            return False

        print(f"[OK] Usuario encontrado:")
        print(f"  - ID: {user.id}")
        print(f"  - Nome: {user.name}")
        print(f"  - Email: {user.email}")
        print(f"  - Role: {user.role}")
        print(f"  - Ativo: {user.active}")
        print(f"  - Hash: {user.password_hash[:50]}...")

        # Verificar senha
        print(f"\nVerificando senha...")
        is_valid = verify_password(password, user.password_hash)

        if is_valid:
            print(f"[OK] SENHA CORRETA!")
            print(f"\n{'='*60}")
            print(f"LOGIN VALIDO - Credenciais funcionando!")
            print(f"{'='*60}")
            return True
        else:
            print(f"[X] SENHA INCORRETA")
            return False

    except Exception as e:
        print(f"\n[ERRO] {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    # Testar com admin
    test_login("admin@lifecalling.com", "Admin@2025")

    # Testar mais alguns
    print("\n" + "="*60)
    test_login("financeiro@lifecalling.com", "Financeiro@2025")

    print("\n" + "="*60)
    test_login("atendente1@lifecalling.com", "Atend1@2025")
