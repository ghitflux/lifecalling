"""
Seeds para criar atendimentos diversos atribuídos a diferentes usuários
Simula um ambiente realístico com casos em diferentes status
"""
from datetime import datetime, timedelta
from app.db import SessionLocal
from app.models import User, Client, Case, CaseEvent, Simulation, Contract, Payment, ContractAttachment, Attachment
from app.security import hash_password
import random


# Dados realísticos para clientes
CLIENTES_SEED = [
    ("Maria da Conceição Silva", "12345678901", "MAT001-X", "INSS"),
    ("José Roberto dos Santos", "23456789012", "MAT002-2", "Governo do Estado"),
    ("Ana Lúcia Ferreira Costa", "34567890123", "MAT003-5", "Prefeitura Municipal"),
    ("Carlos Eduardo Oliveira", "45678901234", "MAT004-1", "INSS"),
    ("Francisca de Assis Lima", "56789012345", "MAT005-9", "Ministério da Defesa"),
    ("Luiz Antonio Rocha Neto", "67890123456", "MAT006-7", "Tribunal de Justiça"),
    ("Helena Maria dos Santos", "78901234567", "MAT007-4", "INSS"),
    ("João Batista Alves Silva", "89012345678", "MAT008-8", "Governo do Estado"),
    ("Rosa de Souza Pereira", "90123456789", "MAT009-3", "Prefeitura Municipal"),
    ("Antônio Carlos Moreira", "01234567890", "MAT010-6", "INSS"),
    ("Vera Lúcia Nascimento", "11234567890", "MAT011-2", "Governo do Estado"),
    ("Manuel José da Silva", "21234567890", "MAT012-0", "INSS"),
    ("Carmem Miranda Souza", "31234567890", "MAT013-4", "Prefeitura Municipal"),
    ("Sebastião Ferreira Lima", "41234567890", "MAT014-7", "INSS"),
    ("Aparecida Santos Costa", "51234567890", "MAT015-1", "Governo do Estado"),
    ("Raimundo Nonato Alves", "61234567890", "MAT016-5", "INSS"),
    ("Marlene Pereira Silva", "71234567890", "MAT017-8", "Tribunal de Justiça"),
    ("Francisco das Chagas", "81234567890", "MAT018-2", "INSS"),
    ("Terezinha Jesus Santos", "91234567890", "MAT019-6", "Governo do Estado"),
    ("João Maria dos Santos", "12334567890", "MAT020-9", "INSS"),
]

# Bancos para simulação
BANCOS = ["Santander", "Banco do Brasil", "Caixa Econômica", "Bradesco", "Itaú"]

# Status possíveis para casos
STATUS_CASOS = [
    "novo",                    # 30% - Casos recém criados
    "em_atendimento",         # 25% - Sendo atendidos
    "calculista_pendente",    # 20% - Aguardando cálculo
    "calculo_aprovado",       # 15% - Prontos para fechamento
    "fechamento_aprovado",    # 7%  - Prontos para liberação
    "contrato_efetivado",     # 3%  - Contratos assinados
]

# Pesos para distribuição dos status
STATUS_WEIGHTS = [30, 25, 20, 15, 7, 3]


def ensure_demo_users():
    """Garante que existem usuários demo no sistema"""
    demo_users = [
        ("Carlos Admin", "admin@demo.local", "admin"),
        ("Sara Supervisor", "supervisor@demo.local", "supervisor"),
        ("Fábio Financeiro", "financeiro@demo.local", "financeiro"),
        ("Cida Calculista", "calculista@demo.local", "calculista"),
        ("Ana Atendente", "atendente@demo.local", "atendente"),
        ("Marcos Atendente", "marcos@demo.local", "atendente"),
        ("Julia Supervisora", "julia@demo.local", "supervisor"),
        ("Pedro Calculista", "pedro@demo.local", "calculista"),
    ]

    with SessionLocal() as db:
        for name, email, role in demo_users:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    name=name,
                    email=email,
                    role=role,
                    password_hash=hash_password("123456"),
                    created_at=datetime.utcnow()
                )
                db.add(user)
        db.commit()


def create_diverse_cases():
    """Cria casos diversos atribuídos a diferentes usuários"""

    with SessionLocal() as db:
        # Buscar usuários atendentes e supervisores para atribuição
        atendentes = db.query(User).filter(
            User.role.in_(["atendente", "supervisor"])
        ).all()

        calculistas = db.query(User).filter(User.role == "calculista").all()

        if not atendentes:
            print("❌ Nenhum atendente encontrado. Execute ensure_demo_users() primeiro.")
            return

        # Limpar casos existentes dos clientes de teste (opcional)
        existing_clients = db.query(Client).filter(
            Client.matricula.like("MAT%")
        ).all()

        for client in existing_clients:
            # Remover casos antigos e suas dependências
            old_cases = db.query(Case).filter(Case.client_id == client.id).all()
            for case in old_cases:
                # Primeiro remover eventos do caso
                db.query(CaseEvent).filter(CaseEvent.case_id == case.id).delete()
                # Remover simulações
                db.query(Simulation).filter(Simulation.case_id == case.id).delete()
                # Remover anexos do caso
                db.query(Attachment).filter(Attachment.case_id == case.id).delete()
                # Remover contratos e suas dependências
                contracts = db.query(Contract).filter(Contract.case_id == case.id).all()
                for contract in contracts:
                    # Remover pagamentos do contrato
                    db.query(Payment).filter(Payment.contract_id == contract.id).delete()
                    # Remover anexos do contrato
                    db.query(ContractAttachment).filter(ContractAttachment.contract_id == contract.id).delete()
                    # Agora pode remover o contrato
                    db.delete(contract)
                # Agora pode remover o caso
                db.delete(case)
            db.delete(client)

        db.commit()

        casos_criados = 0
        agora = datetime.utcnow()

        # Criar clientes e casos
        for i, (nome, cpf, matricula, orgao) in enumerate(CLIENTES_SEED):
            try:
                # Criar cliente
                client = Client(
                    name=nome,
                    cpf=cpf,
                    matricula=matricula,
                    orgao=orgao,
                    telefone_preferencial=f"(85) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}"
                )
                db.add(client)
                db.flush()

                # Escolher status baseado nos pesos
                status = random.choices(STATUS_CASOS, weights=STATUS_WEIGHTS)[0]

                # Atribuir usuário baseado no status
                assigned_user = None
                if status in ["em_atendimento", "calculista_pendente"]:
                    assigned_user = random.choice(atendentes)
                elif status in ["calculo_aprovado", "fechamento_aprovado"]:
                    assigned_user = random.choice(atendentes) if atendentes else None

                # Calcular data de criação (últimos 30 dias)
                days_ago = random.randint(1, 30)
                created_at = agora - timedelta(days=days_ago)
                last_update = created_at + timedelta(
                    hours=random.randint(1, 24 * days_ago)
                )

                # Metadados de importação realísticos
                banco_entidade = random.choice(BANCOS)
                # Armazenar banco_entidade nos metadados do caso para uso futuro
                case.metadata_ = {"banco_entidade": banco_entidade}
                # referencia = f"{random.randint(1,12):02d}/2024"  # removido - não utilizado

                # Criar caso
                case = Case(
                    client_id=client.id,
                    status=status,
                    assigned_user_id=assigned_user.id if assigned_user else None,
                    last_update_at=last_update
                )
                db.add(case)
                db.flush()

                # Para casos avançados, criar simulação
                if status in ["calculo_aprovado", "fechamento_aprovado", "contrato_efetivado"]:
                    simulacao = Simulation(
                        case_id=case.id,
                        status="approved",
                        manual_input={
                            "salario_bruto": random.randint(1200, 8000),
                            "margem_disponivel": random.randint(200, 1500),
                            "prazo_desejado": random.randint(60, 84)
                        },
                        results={
                            "valorLiberado": random.randint(15000, 80000),
                            "valorParcela": random.randint(300, 1200),
                            "taxaJuros": round(random.uniform(1.8, 2.4), 2),
                            "prazo": random.randint(60, 84)
                        },
                        created_by=calculistas[0].id if calculistas else 1,
                        created_at=created_at + timedelta(hours=random.randint(2, 48)),
                        updated_at=last_update
                    )
                    db.add(simulacao)

                # Para casos efetivados, criar contrato
                if status == "contrato_efetivado":
                    db.flush()  # Para ter o ID da simulação
                    contrato = Contract(
                        case_id=case.id,
                        total_amount=simulacao.results["valorLiberado"],
                        installments=simulacao.results["prazo"],
                        status="ativo",
                        created_at=last_update
                    )
                    db.add(contrato)

                casos_criados += 1

                # Commit a cada 5 casos para evitar transações muito longas
                if casos_criados % 5 == 0:
                    db.commit()

            except Exception as e:
                print(f"❌ Erro ao criar caso para {nome}: {e}")
                db.rollback()

        # Commit final
        db.commit()
        print(f"✅ {casos_criados} casos criados com sucesso!")

        # Exibir estatísticas
        print("\n📊 Estatísticas dos casos criados:")
        for status in STATUS_CASOS:
            count = db.query(Case).filter(Case.status == status).count()
            print(f"  - {status}: {count} casos")

        # Estatísticas por usuário
        print("\n👥 Casos por usuário:")
        for user in atendentes:
            count = db.query(Case).filter(Case.assigned_user_id == user.id).count()
            print(f"  - {user.name} ({user.role}): {count} casos")

        unassigned = db.query(Case).filter(Case.assigned_user_id.is_(None)).count()
        print(f"  - Não atribuídos: {unassigned} casos")


def create_historical_data():
    """Cria alguns clientes com histórico de contratos para testar snapshot"""

    with SessionLocal() as db:
        # Criar 3 clientes com contratos anteriores
        historicos = [
            ("Maria Histórica Santos", "99988877766", "HIST001-X", "INSS"),
            ("João Veterano Silva", "88877766655", "HIST002-Y", "Governo do Estado"),
            ("Ana Retornante Costa", "77766655544", "HIST003-Z", "INSS"),
        ]

        for nome, cpf, matricula, orgao in historicos:
            # Criar cliente
            client = Client(
                name=nome,
                cpf=cpf,
                matricula=matricula,
                orgao=orgao
            )
            db.add(client)
            db.flush()

            # Criar caso antigo já finalizado
            old_case = Case(
                client_id=client.id,
                status="contrato_efetivado",
                last_update_at=datetime.utcnow() - timedelta(days=60)
            )
            db.add(old_case)
            db.flush()

            # Criar contrato antigo
            old_contract = Contract(
                case_id=old_case.id,
                total_amount=random.randint(20000, 50000),
                installments=random.randint(60, 84),
                status="ativo",
                created_at=datetime.utcnow() - timedelta(days=60)
            )
            db.add(old_contract)
            db.flush()

            # Agora criar um novo caso (que vai ter snapshot do anterior)
            # Isso será testado quando fizer uma nova importação
            print(f"✅ Cliente histórico criado: {nome} (ID: {client.id})")

        db.commit()


if __name__ == "__main__":
    print("🌱 Criando seeds de atendimentos...")
    ensure_demo_users()
    create_diverse_cases()
    create_historical_data()
    print("✅ Seeds criados com sucesso!")
