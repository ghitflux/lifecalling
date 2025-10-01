#!/usr/bin/env python3
"""
Script para popular dados específicos para CALCULISTA
Cria casos em status 'calculista_pendente' com simulações em draft
"""

import os
import sys
import random
from datetime import datetime, timedelta

# Adicionar o diretório app ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db import SessionLocal
from app.models import User, Client, Case, Simulation, CaseEvent

# Dados específicos para calculista
CLIENTES_CALCULISTA = [
    ("João Silva Calculista", "12345678901", "CALC001", "PREFEITURA FORTALEZA"),
    ("Maria Santos Calculista", "23456789012", "CALC002", "GOVERNO DO CEARÁ"),
    ("Pedro Oliveira Calculista", "34567890123", "CALC003", "TRIBUNAL DE JUSTIÇA"),
    ("Ana Costa Calculista", "45678901234", "CALC004", "ASSEMBLEIA LEGISLATIVA"),
    ("Carlos Ferreira Calculista", "56789012345", "CALC005", "PREFEITURA CAUCAIA"),
    ("Lucia Pereira Calculista", "67890123456", "CALC006", "GOVERNO DO CEARÁ"),
    ("Roberto Lima Calculista", "78901234567", "CALC007", "PREFEITURA MARACANAÚ"),
    ("Sandra Alves Calculista", "89012345678", "CALC008", "TRIBUNAL DE CONTAS"),
    ("Fernando Rocha Calculista", "90123456789", "CALC009", "PREFEITURA SOBRAL"),
    ("Juliana Mendes Calculista", "01234567890", "CALC010", "DEFENSORIA PÚBLICA"),
    ("Ricardo Barbosa Calculista", "11234567890", "CALC011", "MINISTÉRIO PÚBLICO"),
    ("Patrícia Gomes Calculista", "21234567890", "CALC012", "PREFEITURA JUAZEIRO"),
    ("Marcos Souza Calculista", "31234567890", "CALC013", "GOVERNO DO CEARÁ"),
    ("Carla Dias Calculista", "41234567890", "CALC014", "TRIBUNAL REGIONAL"),
    ("Eduardo Martins Calculista", "51234567890", "CALC015", "PREFEITURA CRATO")
]

BANCOS_CALCULISTA = [
    "BANCO DO BRASIL", "CAIXA ECONÔMICA FEDERAL", "BRADESCO", 
    "ITAÚ", "SANTANDER", "SICOOB", "SICREDI", "BANRISUL"
]

def create_calculista_cases():
    """Cria casos específicos para calculista com simulações em draft"""
    
    with SessionLocal() as db:
        print("🧮 Criando casos para CALCULISTA...")
        
        # Buscar calculistas disponíveis
        calculistas = db.query(User).filter(User.role == "calculista").all()
        atendentes = db.query(User).filter(User.role.in_(["atendente", "supervisor"])).all()
        
        if not calculistas:
            print("❌ Nenhum calculista encontrado. Criando usuário calculista padrão...")
            calculista_default = User(
                email="calculista@lifecalling.com",
                name="Calculista Padrão",
                role="calculista",
                hashed_password="$2b$12$dummy_hash"  # Hash dummy
            )
            db.add(calculista_default)
            db.commit()
            calculistas = [calculista_default]
        
        # Limpar casos existentes de calculista (opcional)
        existing_calc_clients = db.query(Client).filter(
            Client.matricula.like("CALC%")
        ).all()
        
        for client in existing_calc_clients:
            # Remover casos e dependências
            old_cases = db.query(Case).filter(Case.client_id == client.id).all()
            for case in old_cases:
                db.query(CaseEvent).filter(CaseEvent.case_id == case.id).delete()
                db.query(Simulation).filter(Simulation.case_id == case.id).delete()
                db.delete(case)
            db.delete(client)
        
        db.commit()
        
        casos_criados = 0
        agora = datetime.utcnow()
        
        # Criar casos para calculista
        for i, (nome, cpf, matricula, orgao) in enumerate(CLIENTES_CALCULISTA):
            try:
                # Criar cliente
                client = Client(
                    name=nome,
                    cpf=cpf,
                    matricula=matricula,
                    orgao=orgao,
                    telefone_preferencial=f"(85) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}",
                    banco=random.choice(BANCOS_CALCULISTA),
                    agencia=f"{random.randint(1000,9999)}",
                    conta=f"{random.randint(10000,99999)}-{random.randint(0,9)}"
                )
                db.add(client)
                db.flush()
                
                # Calcular datas (casos dos últimos 15 dias)
                days_ago = random.randint(1, 15)
                created_at = agora - timedelta(days=days_ago)
                last_update = created_at + timedelta(hours=random.randint(1, 12))
                
                # Criar caso em status calculista_pendente
                case = Case(
                    client_id=client.id,
                    status="calculista_pendente",
                    assigned_user_id=random.choice(atendentes).id if atendentes else None,
                    last_update_at=last_update
                )
                db.add(case)
                db.flush()
                
                # Criar simulação em draft (pendente de cálculo)
                simulacao = Simulation(
                    case_id=case.id,
                    status="draft",  # Status draft = aguardando cálculo
                    manual_input={
                        "salario_bruto": random.randint(1500, 12000),
                        "margem_disponivel": random.randint(300, 2500),
                        "prazo_desejado": random.randint(60, 84),
                        "banco_preferencial": random.choice(BANCOS_CALCULISTA),
                        "observacoes": f"Caso enviado para cálculo em {created_at.strftime('%d/%m/%Y')}"
                    },
                    results=None,  # Sem resultados ainda
                    created_by=atendentes[0].id if atendentes else 1,
                    created_at=created_at + timedelta(minutes=random.randint(30, 180)),
                    updated_at=last_update
                )
                db.add(simulacao)
                
                # Criar evento de envio para calculista
                evento = CaseEvent(
                    case_id=case.id,
                    type="case.to_calculista",
                    payload={
                        "simulation_id": None,  # Será preenchido após flush
                        "sent_by": atendentes[0].id if atendentes else 1,
                        "notes": f"Caso enviado para análise do calculista"
                    },
                    created_by=atendentes[0].id if atendentes else 1,
                    created_at=created_at + timedelta(minutes=random.randint(5, 30))
                )
                db.add(evento)
                
                casos_criados += 1
                
            except Exception as e:
                print(f"❌ Erro ao criar caso {i+1}: {e}")
                db.rollback()
                continue
        
        try:
            db.commit()
            print(f"✅ {casos_criados} casos criados para CALCULISTA!")
            print(f"📊 Status: calculista_pendente")
            print(f"🎯 Simulações: {casos_criados} em status 'draft' (aguardando cálculo)")
            
            # Mostrar distribuição
            total_calc_cases = db.query(Case).filter(Case.status == "calculista_pendente").count()
            print(f"📈 Total de casos para calculista no sistema: {total_calc_cases}")
            
        except Exception as e:
            print(f"❌ Erro ao salvar casos: {e}")
            db.rollback()

def main():
    """Função principal"""
    print("🚀 Iniciando seed para CALCULISTA...")
    create_calculista_cases()
    print("✅ Seed de calculista concluído!")

if __name__ == "__main__":
    main()