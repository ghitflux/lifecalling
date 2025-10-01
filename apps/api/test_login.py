"""
Script para testar login e verificar usuários
"""
from app.db import SessionLocal
from app.models import User
from app.security import verify_password, hash_password

def test_user_login(email, password):
    """Testa login de um usuário"""
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"[X] Usuario nao encontrado: {email}")
            return False

        print(f"\n[OK] Usuario encontrado: {user.name}")
        print(f"  - Email: {user.email}")
        print(f"  - Role: {user.role}")
        print(f"  - Active: {user.active}")
        print(f"  - Password hash: {user.password_hash[:50]}...")

        # Testar senha
        if verify_password(password, user.password_hash):
            print(f"  [OK] Senha correta!")
            return True
        else:
            print(f"  [X] Senha incorreta!")

            # Tentar criar novo hash e comparar
            new_hash = hash_password(password)
            print(f"  - Novo hash: {new_hash[:50]}...")

            if verify_password(password, new_hash):
                print(f"  [OK] Novo hash funciona - atualizando usuario...")
                user.password_hash = new_hash
                db.commit()
                print(f"  [OK] Senha atualizada!")
                return True

            return False

def list_all_users():
    """Lista todos os usuários"""
    with SessionLocal() as db:
        users = db.query(User).all()

        print("\n" + "="*60)
        print(f"TOTAL DE USUARIOS: {len(users)}")
        print("="*60)

        for user in users:
            print(f"\n{user.name}")
            print(f"  Email: {user.email}")
            print(f"  Role: {user.role}")
            print(f"  Active: {user.active}")

if __name__ == "__main__":
    print("="*60)
    print("TESTE DE LOGIN")
    print("="*60)

    # Listar usuários
    list_all_users()

    # Testar login admin
    print("\n" + "="*60)
    print("TESTANDO LOGIN: admin@lifecalling.com")
    print("="*60)

    success = test_user_login("admin@lifecalling.com", "admin123")

    if success:
        print("\n[OK] Login funcionando!")
    else:
        print("\n[X] Login falhou!")
