#!/usr/bin/env python3
"""
Script para identificar e corrigir problemas que causam erros na API de casos
"""

import os
import sys

# Configurar variáveis de ambiente para conexão com o banco
os.environ['POSTGRES_HOST'] = 'localhost'
os.environ['POSTGRES_PORT'] = '5432'
os.environ['POSTGRES_DB'] = 'lifecalling'
os.environ['POSTGRES_USER'] = 'lifecalling'
os.environ['POSTGRES_PASSWORD'] = 'lifecalling'

# Adicionar o diretório da API ao path
sys.path.append('apps/api')

from app.db import SessionLocal
from app.models import Case, Client, User
from sqlalchemy.orm import joinedload

def diagnose_case_errors():
    """Diagnostica problemas que podem causar erros na API de casos"""
    
    print("🔍 Diagnosticando problemas nos casos...")
    
    with SessionLocal() as db:
        # 1. Casos sem client_id
        cases_without_client = db.query(Case).filter(Case.client_id.is_(None)).all()
        print(f"📊 Casos sem client_id: {len(cases_without_client)}")
        
        # 2. Casos com client_id inválido (cliente não existe)
        cases_with_invalid_client = []
        all_cases = db.query(Case).all()
        
        for case in all_cases:
            if case.client_id:
                client = db.get(Client, case.client_id)
                if not client:
                    cases_with_invalid_client.append(case)
        
        print(f"📊 Casos com client_id inválido: {len(cases_with_invalid_client)}")
        
        # 3. Casos com assigned_user_id inválido
        cases_with_invalid_user = []
        for case in all_cases:
            if case.assigned_user_id:
                user = db.get(User, case.assigned_user_id)
                if not user:
                    cases_with_invalid_user.append(case)
        
        print(f"📊 Casos com assigned_user_id inválido: {len(cases_with_invalid_user)}")
        
        # 4. Clientes com dados problemáticos
        clients_with_issues = []
        all_clients = db.query(Client).all()
        
        for client in all_clients:
            issues = []
            if not client.name or client.name.strip() == "":
                issues.append("nome vazio")
            if not client.cpf or client.cpf.strip() == "":
                issues.append("cpf vazio")
            if not client.matricula or client.matricula.strip() == "":
                issues.append("matricula vazia")
            
            if issues:
                clients_with_issues.append((client, issues))
        
        print(f"📊 Clientes com dados problemáticos: {len(clients_with_issues)}")
        
        # 5. Testar o processamento de casos como na API
        print("\n🧪 Testando processamento de casos...")
        
        # Simular a query da API
        qry = db.query(Case).options(joinedload(Case.client), joinedload(Case.assigned_user))
        rows = qry.limit(10).all()  # Testar apenas os primeiros 10
        
        problematic_cases = []
        
        for c in rows:
            try:
                # Simular o processamento da API
                item = {
                    "id": c.id,
                    "status": c.status or "novo",
                    "client_id": c.client_id,
                    "assigned_user_id": c.assigned_user_id,
                    "assigned_to": c.assigned_user.name if c.assigned_user else None,
                    "last_update_at": c.last_update_at.isoformat() if c.last_update_at else None,
                    "created_at": getattr(c, 'created_at', None),  # Pode não existir
                    "banco": getattr(c, 'banco', None),
                }

                # Client info
                if hasattr(c, 'client') and c.client:
                    item["client"] = {
                        "name": c.client.name or "Nome não informado",
                        "cpf": c.client.cpf or "",
                        "matricula": c.client.matricula or ""
                    }
                else:
                    client = db.get(Client, c.client_id) if c.client_id else None
                    if client:
                        item["client"] = {
                            "name": client.name or "Nome não informado",
                            "cpf": client.cpf or "",
                            "matricula": client.matricula or ""
                        }
                    else:
                        item["client"] = {
                            "name": "Cliente não encontrado",
                            "cpf": "",
                            "matricula": ""
                        }
                
                print(f"✅ Caso {c.id} processado com sucesso")
                
            except Exception as e:
                print(f"❌ Erro ao processar caso {c.id}: {e}")
                problematic_cases.append((c, str(e)))
        
        print(f"\n📊 Casos problemáticos encontrados: {len(problematic_cases)}")
        
        return {
            'cases_without_client': cases_without_client,
            'cases_with_invalid_client': cases_with_invalid_client,
            'cases_with_invalid_user': cases_with_invalid_user,
            'clients_with_issues': clients_with_issues,
            'problematic_cases': problematic_cases
        }

def fix_case_errors(issues):
    """Corrige os problemas identificados"""
    
    print("\n🔧 Iniciando correções...")
    
    with SessionLocal() as db:
        fixes_applied = 0
        
        # 1. Corrigir casos sem client_id - remover ou criar cliente dummy
        for case in issues['cases_without_client']:
            print(f"🔧 Removendo caso {case.id} sem cliente...")
            db.delete(case)
            fixes_applied += 1
        
        # 2. Corrigir casos com client_id inválido
        for case in issues['cases_with_invalid_client']:
            print(f"🔧 Removendo caso {case.id} com cliente inválido (ID: {case.client_id})...")
            db.delete(case)
            fixes_applied += 1
        
        # 3. Corrigir casos com assigned_user_id inválido
        for case in issues['cases_with_invalid_user']:
            print(f"🔧 Removendo atribuição inválida do caso {case.id} (User ID: {case.assigned_user_id})...")
            case.assigned_user_id = None
            fixes_applied += 1
        
        # 4. Corrigir clientes com dados problemáticos
        for client, client_issues in issues['clients_with_issues']:
            print(f"🔧 Corrigindo cliente {client.id}: {', '.join(client_issues)}")
            
            if not client.name or client.name.strip() == "":
                client.name = f"Cliente {client.id}"
            if not client.cpf or client.cpf.strip() == "":
                client.cpf = f"000000000{client.id:02d}"[-11:]  # CPF dummy
            if not client.matricula or client.matricula.strip() == "":
                client.matricula = f"MAT{client.id:04d}"
            
            fixes_applied += 1
        
        db.commit()
        print(f"✅ {fixes_applied} correções aplicadas com sucesso!")

if __name__ == "__main__":
    print("🚀 Iniciando diagnóstico e correção de erros nos casos...")
    
    # Diagnosticar problemas
    issues = diagnose_case_errors()
    
    # Perguntar se deve aplicar correções
    total_issues = (len(issues['cases_without_client']) + 
                   len(issues['cases_with_invalid_client']) + 
                   len(issues['cases_with_invalid_user']) + 
                   len(issues['clients_with_issues']))
    
    if total_issues > 0:
        print(f"\n⚠️  Encontrados {total_issues} problemas que podem causar erros na API.")
        response = input("Deseja aplicar as correções? (s/N): ").lower().strip()
        
        if response in ['s', 'sim', 'y', 'yes']:
            fix_case_errors(issues)
        else:
            print("❌ Correções não aplicadas.")
    else:
        print("✅ Nenhum problema encontrado nos dados!")
    
    print("\n🎉 Diagnóstico concluído!")