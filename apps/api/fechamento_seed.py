#!/usr/bin/env python3
"""
Script para popular dados específicos para FECHAMENTO
Cria casos em status 'calculo_aprovado' com simulações aprovadas prontas para fechamento
"""

import os
import sys
import random
from datetime import datetime, timedelta

# Adicionar o diretório app ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db import SessionLocal
from app.models import User, Client, Case, Simulation, CaseEvent

# Dados específicos para fechamento
CLIENTES_FECHAMENTO = [
    ("José Fechamento Silva", "12345678901", "FECH001", "PREFEITURA FORTALEZA"),
    ("Maria Fechamento Santos", "23456789012", "FECH002", "GOVERNO DO CEARÁ"),
    ("Pedro Fechamento Oliveira", "34567890123", "FECH003", "TRIBUNAL DE JUSTIÇA"),
    ("Ana Fechamento Costa", "45678901234", "FECH004", "ASSEMBLEIA LEGISLATIVA"),
    ("Carlos Fechamento Ferreira", "56789012345", "FECH005", "PREFEITURA CAUCAIA"),
    ("Lucia Fechamento Pereira", "67890123456", "FECH006", "GOVERNO DO CEARÁ"),
    ("Roberto Fechamento Lima", "78901234567", "FECH007", "PREFEITURA MARACANAÚ"),
    ("Sandra Fechamento Alves", "89012345678", "FECH008", "TRIBUNAL DE CONTAS"),
    ("Fernando Fechamento Rocha", "90123456789", "FECH009", "PREFEITURA SOBRAL"),
    ("Juliana Fechamento Mendes", "01234567890", "FECH010", "DEFENSORIA PÚBLICA"),
    ("Ricardo Fechamento Barbosa", "11234567890", "FECH011", "MINISTÉRIO PÚBLICO"),
    ("Patrícia Fechamento Gomes", "21234567890", "FECH012", "PREFEITURA JUAZEIRO"),
    ("Marcos Fechamento Souza", "31234567890", "FECH013", "GOVERNO DO CEARÁ"),
    ("Carla Fechamento Dias", "41234567890", "FECH014", "TRIBUNAL REGIONAL"),
    ("Eduardo Fechamento Martins", "51234567890", "FECH015", "PREFEITURA CRATO"),
    ("Beatriz Fechamento Almeida", "61234567890", "FECH016", "PREFEITURA IGUATU"),
    ("Gabriel Fechamento Nascimento", "71234567890", "FECH017", "GOVERNO DO CEARÁ"),
    ("Camila Fechamento Rodrigues", "81234567890", "FECH018", "TRIBUNAL ELEITORAL")
]

BANCOS_FECHAMENTO = [
    "BANCO DO BRASIL", "CAIXA ECONÔMICA FEDERAL", "BRADESCO", 
    "ITAÚ", "SANTANDER", "SICOOB", "SICREDI", "BANRISUL"
]

# Produtos financeiros realísticos
PRODUTOS_FINANCEIROS = [
    {
        "nome": "Crédito Consignado Servidor Público",
        "taxa_mes": 1.80,
        "prazo_max": 84,
        "valor_min": 5000,
        "valor_max": 80000
    },
    {
        "nome": "Empréstimo Pessoal Consignado",
        "taxa_mes": 2.10,
        "prazo_max": 72,
        "valor_min": 3000,
        "valor_max": 60000
    },
    {
        "nome": "Refinanciamento Consignado",
        "taxa_mes": 1.95,
        "prazo_max": 84,
        "valor_min": 10000,
        "valor_max": 100000
    }
]

def create_fechamento_cases():
    """Cria casos específicos para fechamento com simulações aprovadas"""
    
    with SessionLocal() as db:
        print("📋 Criando casos para FECHAMENTO...")
        
        # Buscar usuários
        calculistas = db.query(User).filter(User.role == "calculista").all()
        atendentes = db.query(User).filter(User.role.in_(["atendente", "supervisor"])).all()
        
        if not calculistas:
            print("❌ Nenhum calculista encontrado. Criando usuário calculista padrão...")
            calculista_default = User(
                email="calculista@lifecalling.com",
                name="Calculista Padrão",
                role="calculista",
                hashed_password="$2b$12$dummy_hash"
            )
            db.add(calculista_default)
            db.commit()
            calculistas = [calculista_default]
        
        # Limpar casos existentes de fechamento (opcional)
        existing_fech_clients = db.query(Client).filter(
            Client.matricula.like("FECH%")
        ).all()
        
        for client in existing_fech_clients:
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
        
        # Criar casos para fechamento
        for i, (nome, cpf, matricula, orgao) in enumerate(CLIENTES_FECHAMENTO):
            try:
                # Criar cliente com dados bancários completos
                client = Client(
                    name=nome,
                    cpf=cpf,
                    matricula=matricula,
                    orgao=orgao,
                    telefone_preferencial=f"(85) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}",
                    banco=random.choice(BANCOS_FECHAMENTO),
                    agencia=f"{random.randint(1000,9999)}",
                    conta=f"{random.randint(10000,99999)}-{random.randint(0,9)}",
                    chave_pix=cpf,
                    tipo_chave_pix="cpf",
                    numero_cliente=f"CLI{random.randint(100000,999999)}"
                )
                db.add(client)
                db.flush()
                
                # Calcular datas (casos dos últimos 20 dias, já processados)
                days_ago = random.randint(5, 20)
                created_at = agora - timedelta(days=days_ago)
                calc_date = created_at + timedelta(days=random.randint(1, 3))
                last_update = calc_date + timedelta(hours=random.randint(1, 24))
                
                # Criar caso em status calculo_aprovado
                case = Case(
                    client_id=client.id,
                    status="calculo_aprovado",
                    assigned_user_id=random.choice(atendentes).id if atendentes else None,
                    last_update_at=last_update
                )
                db.add(case)
                db.flush()
                
                # Escolher produto financeiro
                produto = random.choice(PRODUTOS_FINANCEIROS)
                salario_bruto = random.randint(2000, 15000)
                margem_disponivel = random.randint(400, int(salario_bruto * 0.35))
                prazo = random.randint(60, produto["prazo_max"])
                
                # Calcular valores realísticos
                valor_liberado = random.randint(
                    max(produto["valor_min"], margem_disponivel * 20),
                    min(produto["valor_max"], margem_disponivel * 40)
                )
                taxa_mes = produto["taxa_mes"] + random.uniform(-0.2, 0.3)
                valor_parcela = int(valor_liberado * (taxa_mes/100) * ((1 + taxa_mes/100)**prazo) / (((1 + taxa_mes/100)**prazo) - 1))
                
                # Criar simulação aprovada (pronta para fechamento)
                simulacao = Simulation(
                    case_id=case.id,
                    status="approved",  # Status approved = pronto para fechamento
                    manual_input={
                        "salario_bruto": salario_bruto,
                        "margem_disponivel": margem_disponivel,
                        "prazo_desejado": prazo,
                        "banco_preferencial": client.banco,
                        "produto_escolhido": produto["nome"],
                        "observacoes": f"Simulação aprovada em {calc_date.strftime('%d/%m/%Y')}"
                    },
                    results={
                        "valorLiberado": valor_liberado,
                        "valorParcela": valor_parcela,
                        "taxaJuros": round(taxa_mes, 2),
                        "prazo": prazo,
                        "produto": produto["nome"],
                        "banco": client.banco,
                        "valorTotal": valor_parcela * prazo,
                        "custoEfetivoTotal": round((valor_parcela * prazo - valor_liberado) / valor_liberado * 100, 2),
                        "dataVencimento": (agora + timedelta(days=30)).strftime("%Y-%m-%d"),
                        "observacoes": "Simulação aprovada pelo calculista. Pronta para fechamento."
                    },
                    created_by=random.choice(calculistas).id,
                    created_at=created_at + timedelta(hours=random.randint(2, 12)),
                    updated_at=calc_date
                )
                db.add(simulacao)
                
                # Criar eventos do fluxo
                # 1. Envio para calculista
                evento_calc = CaseEvent(
                    case_id=case.id,
                    type="case.to_calculista",
                    payload={
                        "simulation_id": None,
                        "sent_by": atendentes[0].id if atendentes else 1
                    },
                    created_by=atendentes[0].id if atendentes else 1,
                    created_at=created_at + timedelta(minutes=30)
                )
                db.add(evento_calc)
                
                # 2. Aprovação da simulação
                evento_aprovacao = CaseEvent(
                    case_id=case.id,
                    type="simulation.approved",
                    payload={
                        "simulation_id": None,  # Será preenchido após flush
                        "approved_by": random.choice(calculistas).id,
                        "valor_liberado": valor_liberado,
                        "valor_parcela": valor_parcela,
                        "prazo": prazo,
                        "notes": "Simulação aprovada. Caso liberado para fechamento."
                    },
                    created_by=random.choice(calculistas).id,
                    created_at=calc_date
                )
                db.add(evento_aprovacao)
                
                casos_criados += 1
                
            except Exception as e:
                print(f"❌ Erro ao criar caso {i+1}: {e}")
                db.rollback()
                continue
        
        try:
            db.commit()
            print(f"✅ {casos_criados} casos criados para FECHAMENTO!")
            print(f"📊 Status: calculo_aprovado")
            print(f"🎯 Simulações: {casos_criados} em status 'approved' (prontas para fechamento)")
            
            # Mostrar distribuição
            total_fech_cases = db.query(Case).filter(Case.status == "calculo_aprovado").count()
            print(f"📈 Total de casos para fechamento no sistema: {total_fech_cases}")
            
            # Mostrar estatísticas das simulações
            simulacoes = db.query(Simulation).filter(Simulation.status == "approved").all()
            if simulacoes:
                valores = [s.results.get("valorLiberado", 0) for s in simulacoes if s.results]
                if valores:
                    print(f"💰 Valor médio liberado: R$ {sum(valores)/len(valores):,.2f}")
                    print(f"💰 Valor total em simulações: R$ {sum(valores):,.2f}")
            
        except Exception as e:
            print(f"❌ Erro ao salvar casos: {e}")
            db.rollback()

def main():
    """Função principal"""
    print("🚀 Iniciando seed para FECHAMENTO...")
    create_fechamento_cases()
    print("✅ Seed de fechamento concluído!")

if __name__ == "__main__":
    main()