#!/usr/bin/env python3
"""
Script para limpar o banco de dados e criar apenas usuários essenciais.
"""
import sys
from pathlib import Path

# Adiciona o diretório pai ao path para importar módulos
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.db import SessionLocal, engine
from app.models import User
from app.security import hash_password

def clean_database():
    """Limpa todas as tabelas mantendo apenas a estrutura."""
    print("\n[LIMPEZA] Limpando banco de dados...")
    
    with SessionLocal() as db:
        # Ordem de exclusão respeitando foreign keys
        tables_to_clean = [
            "contract_attachments",
            "contracts",
            "case_events",
            "simulations",
            "attachments",
            "cases",
            "client_phones",
            "clients",
            "payroll_lines",
            "payroll_contracts",
            "payroll_clients",
            "import_batches",
            "payroll_import_batches",
            "finance_expenses",
            "finance_incomes",
            "agent_targets",
            "campaigns",
            "users"
        ]
        
        for table in tables_to_clean:
            try:
                db.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE"))
                db.commit()
                print(f"  [OK] Tabela {table} limpa")
            except Exception as e:
                db.rollback()
                # Se a tabela não existe, apenas avisa e continua
                if "does not exist" in str(e):
                    print(f"  [AVISO] Tabela {table} nao existe")
                else:
                    print(f"  [AVISO] Erro ao limpar {table}: {e}")
        
        print("[OK] Banco de dados limpo com sucesso!\n")

def create_users():
    """Cria os usuários essenciais."""
    print("[USUARIOS] Criando usuarios...")
    
    users_data = [
        # 2 Admins
        ("Carlos Admin", "admin1@lifecalling.com.br", "admin", "Admin@123"),
        ("Maria Admin", "admin2@lifecalling.com.br", "admin", "Admin@123"),
        
        # 1 Supervisor
        ("João Supervisor", "supervisor@lifecalling.com.br", "supervisor", "Super@123"),
        
        # 1 Financeiro
        ("Ana Financeira", "financeiro@lifecalling.com.br", "financeiro", "Fin@123"),
        
        # 1 Gerente de Fechamento
        ("Pedro Fechamento", "fechamento@lifecalling.com.br", "fechamento", "Fech@123"),
        
        # 1 Calculista
        ("Julia Calculista", "calculista@lifecalling.com.br", "calculista", "Calc@123"),
        
        # 7 Atendentes
        ("Lucas Atendente", "atendente1@lifecalling.com.br", "atendente", "Atend@123"),
        ("Mariana Atendente", "atendente2@lifecalling.com.br", "atendente", "Atend@123"),
        ("Felipe Atendente", "atendente3@lifecalling.com.br", "atendente", "Atend@123"),
        ("Camila Atendente", "atendente4@lifecalling.com.br", "atendente", "Atend@123"),
        ("Rafael Atendente", "atendente5@lifecalling.com.br", "atendente", "Atend@123"),
        ("Beatriz Atendente", "atendente6@lifecalling.com.br", "atendente", "Atend@123"),
        ("Thiago Atendente", "atendente7@lifecalling.com.br", "atendente", "Atend@123"),
    ]
    
    with SessionLocal() as db:
        try:
            for name, email, role, password in users_data:
                user = User(
                    name=name,
                    email=email,
                    role=role,
                    password_hash=hash_password(password),
                    active=True
                )
                db.add(user)
                print(f"  [OK] Criado: {name} ({role}) - {email}")
            
            db.commit()
            print("\n[OK] Todos os usuarios criados com sucesso!\n")
            
        except Exception as e:
            db.rollback()
            print(f"[ERRO] Erro ao criar usuarios: {e}")
            raise

def print_credentials():
    """Exibe as credenciais de acesso."""
    print("\n" + "="*70)
    print("CREDENCIAIS DE ACESSO")
    print("="*70)
    print("\nSENHAS: Mostradas abaixo por role\n")
    
    credentials = [
        ("ADMINISTRADORES", [
            ("Carlos Admin", "admin1@lifecalling.com.br", "Admin@123"),
            ("Maria Admin", "admin2@lifecalling.com.br", "Admin@123"),
        ]),
        ("SUPERVISOR", [
            ("João Supervisor", "supervisor@lifecalling.com.br", "Super@123"),
        ]),
        ("FINANCEIRO", [
            ("Ana Financeira", "financeiro@lifecalling.com.br", "Fin@123"),
        ]),
        ("GERENTE DE FECHAMENTO", [
            ("Pedro Fechamento", "fechamento@lifecalling.com.br", "Fech@123"),
        ]),
        ("CALCULISTA", [
            ("Julia Calculista", "calculista@lifecalling.com.br", "Calc@123"),
        ]),
        ("ATENDENTES", [
            ("Lucas Atendente", "atendente1@lifecalling.com.br", "Atend@123"),
            ("Mariana Atendente", "atendente2@lifecalling.com.br", "Atend@123"),
            ("Felipe Atendente", "atendente3@lifecalling.com.br", "Atend@123"),
            ("Camila Atendente", "atendente4@lifecalling.com.br", "Atend@123"),
            ("Rafael Atendente", "atendente5@lifecalling.com.br", "Atend@123"),
            ("Beatriz Atendente", "atendente6@lifecalling.com.br", "Atend@123"),
            ("Thiago Atendente", "atendente7@lifecalling.com.br", "Atend@123"),
        ]),
    ]
    
    for role_name, users in credentials:
        print(f"\n{role_name}")
        print("-" * 70)
        for name, email, password in users:
            print(f"  - {name:25} | {email:35} | {password}")
    
    print("\n" + "="*70)
    print("\nAcesse: http://localhost:3000/login")
    print("="*70 + "\n")

def main():
    print("\n" + "="*70)
    print("LIMPEZA E SEED DO BANCO DE DADOS - LIFECALLING")
    print("="*70)
    
    try:
        # Limpar banco
        clean_database()
        
        # Criar usuários
        create_users()
        
        # Exibir credenciais
        print_credentials()
        
        print("[OK] Processo concluido com sucesso!")
        
    except Exception as e:
        print(f"\n[ERRO] Erro durante o processo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

