"""
Script para popular o banco de dados com clientes mobile e simulações de teste.
Execute: python seed_mobile.py
"""

from app.db import SessionLocal
from app.models import User, MobileSimulation
from app.security import hash_password
from datetime import datetime, timedelta
from pathlib import Path
import random

def create_seed_data():
    db = SessionLocal()
    
    try:
        upload_dir = Path("uploads/mobile_documents")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Verificar se já existem clientes mobile
        existing_mobile_users = db.query(User).filter(User.role == "mobile_client").count()
        
        print(f"🔍 Encontrados {existing_mobile_users} usuários mobile existentes")
        
        # Criar clientes mobile de teste
        mobile_clients = []
        client_names = [
            ("João Silva", "joao.silva@mobile.com"),
            ("Maria Santos", "maria.santos@mobile.com"),
            ("Pedro Oliveira", "pedro.oliveira@mobile.com"),
            ("Ana Costa", "ana.costa@mobile.com"),
            ("Carlos Souza", "carlos.souza@mobile.com"),
            ("Beatriz Lima", "beatriz.lima@mobile.com"),
            ("Renato Martins", "renato.martins@mobile.com"),
        ]
        
        print("\n👥 Criando clientes mobile...")
        for name, email in client_names:
            # Verificar se já existe
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"   ⏭️  {name} já existe")
                mobile_clients.append(existing)
            else:
                client = User(
                    name=name,
                    email=email,
                    password_hash=hash_password("senha123"),  # Senha padrão para testes
                    role="mobile_client",  # CORRIGIDO: usar mobile_client ao invés de atendente
                    active=True
                )
                db.add(client)
                db.flush()
                mobile_clients.append(client)
                print(f"   ✅ {name} criado")
        
        db.commit()
        
        # Criar simulações de teste
        print("\n💼 Criando simulações de teste...")
        
        banks_options = [
            [
                {"bank": "SANTANDER", "product": "emprestimo_consignado", "parcela": 500.0, "saldoDevedor": 10000.0, "valorLiberado": 8500.0},
                {"bank": "BRADESCO", "product": "cartao_beneficio", "parcela": 300.0, "saldoDevedor": 5000.0, "valorLiberado": 4200.0}
            ],
            [
                {"bank": "ITAU", "product": "emprestimo_consignado", "parcela": 800.0, "saldoDevedor": 15000.0, "valorLiberado": 12000.0},
            ],
            [
                {"bank": "CAIXA", "product": "cartao_consignado", "parcela": 250.0, "saldoDevedor": 3000.0, "valorLiberado": 2500.0},
                {"bank": "PAN", "product": "emprestimo_consignado", "parcela": 400.0, "saldoDevedor": 8000.0, "valorLiberado": 7000.0},
                {"bank": "BMG", "product": "abase_auxilio", "parcela": 150.0, "saldoDevedor": 2000.0, "valorLiberado": 1800.0}
            ],
            [
                {"bank": "SICOOB", "product": "emprestimo_consignado", "parcela": 600.0, "saldoDevedor": 12000.0, "valorLiberado": 10500.0},
                {"bank": "SICREDI", "product": "cartao_beneficio", "parcela": 200.0, "saldoDevedor": 4000.0, "valorLiberado": 3500.0}
            ],
        ]
        
        statuses = ["pending", "approved", "rejected", "pending", "approved", "pending", "approved"]
        
        for i, client in enumerate(mobile_clients[:len(banks_options)]):
            banks = banks_options[i]
            status = statuses[i]
            
            # Calcular totais
            total_parcela = sum(b["parcela"] for b in banks)
            total_liberado = sum(b["valorLiberado"] for b in banks)
            
            doc_path = None
            doc_type = None
            doc_filename = None

            # Criar um anexo de exemplo apenas para a primeira simulação de cada cliente
            sample_doc = upload_dir / f"{client.id}_{i}_seed.txt"
            sample_doc.write_text(f"Documento de simulação seed para {client.name} em {datetime.now().isoformat()}")
            doc_path = str(sample_doc)
            doc_type = "txt"
            doc_filename = sample_doc.name

            simulation = MobileSimulation(
                user_id=client.id,
                simulation_type="multi_bank",
                requested_amount=total_liberado,
                installments=96,
                interest_rate=1.84,
                installment_value=total_parcela,
                total_amount=total_liberado,
                status=status,
                # Novos campos multi-banco
                banks_json=banks,
                prazo=96,
                coeficiente="0,0192223",
                seguro=1000.0,
                percentual_consultoria=12.0,
                created_at=datetime.now() - timedelta(days=random.randint(1, 30)),
                document_url=doc_path,
                document_type=doc_type,
                document_filename=doc_filename,
            )
            
            db.add(simulation)
            status_emoji = "⏳" if status == "pending" else "✅" if status == "approved" else "❌"
            print(f"   {status_emoji} Simulação para {client.name} - {len(banks)} banco(s) - Status: {status}")
        
        # Criar algumas simulações adicionais para o primeiro cliente
        print("\n📊 Criando simulações adicionais para demonstração...")
        first_client = mobile_clients[0]
        
        additional_simulations = [
            {
                "banks": [{"bank": "SAFRA", "product": "emprestimo_consignado", "parcela": 700.0, "saldoDevedor": 14000.0, "valorLiberado": 12500.0}],
                "status": "pending"
            },
            {
                "banks": [
                    {"bank": "NUBANK", "product": "cartao_beneficio", "parcela": 350.0, "saldoDevedor": 6000.0, "valorLiberado": 5200.0},
                    {"bank": "INTER", "product": "emprestimo_consignado", "parcela": 450.0, "saldoDevedor": 9000.0, "valorLiberado": 7800.0}
                ],
                "status": "approved"
            }
        ]
        
        for sim_data in additional_simulations:
            banks = sim_data["banks"]
            total_parcela = sum(b["parcela"] for b in banks)
            total_liberado = sum(b["valorLiberado"] for b in banks)
            
            simulation = MobileSimulation(
                user_id=first_client.id,
                simulation_type="multi_bank",
                requested_amount=total_liberado,
                installments=96,
                interest_rate=1.84,
                installment_value=total_parcela,
                total_amount=total_liberado,
                status=sim_data["status"],
                banks_json=banks,
                prazo=96,
                coeficiente="0,0192223",
                seguro=1000.0,
                percentual_consultoria=12.0,
                created_at=datetime.now() - timedelta(days=random.randint(1, 15))
            )
            
            db.add(simulation)
            status_emoji = "⏳" if sim_data["status"] == "pending" else "✅"
            print(f"   {status_emoji} Simulação adicional - {len(banks)} banco(s) - Status: {sim_data['status']}")
        
        db.commit()
        
        # Estatísticas finais
        total_clients = db.query(User).filter(User.role == "mobile_client").count()
        total_simulations = db.query(MobileSimulation).count()
        pending = db.query(MobileSimulation).filter(MobileSimulation.status == "pending").count()
        approved = db.query(MobileSimulation).filter(MobileSimulation.status == "approved").count()
        rejected = db.query(MobileSimulation).filter(MobileSimulation.status == "rejected").count()
        
        print("\n" + "="*60)
        print("✨ Seed concluído com sucesso!")
        print("="*60)
        print(f"👥 Total de clientes mobile: {total_clients}")
        print(f"💼 Total de simulações: {total_simulations}")
        print(f"   ⏳ Pendentes: {pending}")
        print(f"   ✅ Aprovadas: {approved}")
        print(f"   ❌ Reprovadas: {rejected}")
        print("="*60)
        print("\n📝 Credenciais de teste:")
        print("   Email: joao.silva@mobile.com")
        print("   Email: maria.santos@mobile.com")
        print("   Email: pedro.oliveira@mobile.com")
        print("   Email: ana.costa@mobile.com")
        print("   Email: carlos.souza@mobile.com")
        print("   Senha (todos): senha123")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Erro ao criar seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Iniciando seed de dados mobile...")
    print("")
    create_seed_data()
