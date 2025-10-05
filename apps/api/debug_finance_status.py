#!/usr/bin/env python3
"""
Script para verificar e corrigir casos com status incorreto no módulo financeiro
"""

import sys
import os

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar os módulos
from app.database import SessionLocal
from app.models import Case, Simulation
from datetime import datetime

def check_finance_status():
    """Verifica casos que podem estar com status incorreto no financeiro"""
    with SessionLocal() as db:
        print("=== VERIFICAÇÃO DE STATUS NO FINANCEIRO ===\n")
        
        # 1. Casos com fechamento_aprovado que deveriam estar como financeiro_pendente
        fechamento_aprovado_cases = db.query(Case).filter(
            Case.status == "fechamento_aprovado"
        ).all()
        
        print(f"Casos com status 'fechamento_aprovado': {len(fechamento_aprovado_cases)}")
        
        for case in fechamento_aprovado_cases:
            print(f"  - Caso #{case.id}: {case.client.name if case.client else 'N/A'}")
            print(f"    Status: {case.status}")
            print(f"    Última simulação: {case.last_simulation_id}")
            if case.last_simulation_id:
                sim = db.get(Simulation, case.last_simulation_id)
                if sim:
                    print(f"    Status da simulação: {sim.status}")
            print()
        
        # 2. Casos na fila do financeiro
        financial_statuses = ["financeiro_pendente", "contrato_efetivado", "contrato_cancelado"]
        finance_cases = db.query(Case).filter(
            Case.status.in_(financial_statuses)
        ).all()
        
        print(f"Casos na fila do financeiro: {len(finance_cases)}")
        for case in finance_cases:
            print(f"  - Caso #{case.id}: {case.client.name if case.client else 'N/A'} - Status: {case.status}")
        
        print("\n=== ANÁLISE ===")
        print(f"Total de casos 'fechamento_aprovado': {len(fechamento_aprovado_cases)}")
        print(f"Total de casos na fila financeiro: {len(finance_cases)}")
        
        # Verificar se algum caso fechamento_aprovado deveria estar no financeiro
        casos_para_corrigir = []
        for case in fechamento_aprovado_cases:
            if case.last_simulation_id:
                sim = db.get(Simulation, case.last_simulation_id)
                if sim and sim.status == "approved":
                    casos_para_corrigir.append(case)
        
        print(f"Casos que deveriam estar como 'financeiro_pendente': {len(casos_para_corrigir)}")
        
        return casos_para_corrigir

def fix_finance_status(casos_para_corrigir):
    """Corrige o status dos casos identificados"""
    if not casos_para_corrigir:
        print("Nenhum caso para corrigir.")
        return
    
    print(f"\n=== CORREÇÃO DE {len(casos_para_corrigir)} CASOS ===")
    
    with SessionLocal() as db:
        for case in casos_para_corrigir:
            print(f"Corrigindo caso #{case.id}...")
            
            # Buscar o caso novamente na sessão atual
            case_db = db.get(Case, case.id)
            if case_db:
                case_db.status = "financeiro_pendente"
                case_db.last_update_at = datetime.utcnow()
                
                print(f"  Status alterado de '{case.status}' para 'financeiro_pendente'")
        
        db.commit()
        print("Correções aplicadas com sucesso!")

if __name__ == "__main__":
    print("Verificando status dos casos no financeiro...\n")
    
    casos_para_corrigir = check_finance_status()
    
    if casos_para_corrigir:
        resposta = input(f"\nDeseja corrigir {len(casos_para_corrigir)} casos? (s/n): ")
        if resposta.lower() in ['s', 'sim', 'y', 'yes']:
            fix_finance_status(casos_para_corrigir)
        else:
            print("Correção cancelada.")
    else:
        print("Nenhum caso precisa de correção.")