#!/usr/bin/env python3
"""
Script para verificar a senha do usuário admin
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import User
from app.auth import verify_password

def check_admin_password():
    """Verifica a senha do usuário admin"""
    
    with SessionLocal() as db:
        admin_user = db.query(User).filter(User.email == "admin1@lifecalling.com").first()
        
        if not admin_user:
            print("❌ Usuário admin não encontrado")
            return
            
        print(f"👤 Usuário encontrado: {admin_user.name} ({admin_user.email})")
        print(f"🔑 Hash da senha: {admin_user.password_hash[:50]}...")
        
        # Testar senhas comuns
        test_passwords = ["admin123", "admin", "123456", "password", "lifecalling"]
        
        for password in test_passwords:
            if verify_password(password, admin_user.password_hash):
                print(f"✅ Senha correta encontrada: {password}")
                return
                
        print("❌ Nenhuma das senhas testadas funcionou")

if __name__ == "__main__":
    check_admin_password()