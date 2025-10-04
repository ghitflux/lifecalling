#!/usr/bin/env python3
"""
Script para verificar usuários no banco de dados
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import User

def check_users():
    """Verifica usuários no banco de dados"""
    
    with SessionLocal() as db:
        users = db.query(User).all()
        
        print(f"📋 Usuários encontrados: {len(users)}")
        
        for user in users:
            print(f"  - ID: {user.id}")
            print(f"    Email: {user.email}")
            print(f"    Nome: {user.name}")
            print(f"    Role: {user.role}")
            print(f"    Ativo: {user.active}")
            print("    ---")

if __name__ == "__main__":
    check_users()