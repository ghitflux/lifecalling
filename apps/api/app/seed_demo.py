from datetime import datetime, timedelta
from app.db import SessionLocal
from app.models import User, Client, Case
from app.security import hash_password
import random

DEMO = [
    ("Carlos Admin", "admin@demo.local", "admin"),
    ("Sara Supervisor", "supervisor@demo.local", "supervisor"),
    ("Fábio Financeiro", "financeiro@demo.local", "financeiro"),
    ("Cida Calculista", "calculista@demo.local", "calculista"),
    ("Ana Atendente", "atendente@demo.local", "atendente"),
    # extras p/ seu modal
    ("Gerente Vendas", "gerente@demo.local", "supervisor"),
    ("Usuário Padrão", "user@demo.local", "atendente"),
]

def upsert_user(name, email, role, password="123456"):
    with SessionLocal() as db:
        u = db.query(User).filter(User.email==email).first()
        if u:
            u.role = role
            db.commit()
            return
        u = User(
            name=name,
            email=email,
            role=role,
            password_hash=hash_password(password),
            created_at=datetime.utcnow(),
        )
        db.add(u); db.commit()

def create_demo_cases():
    """Cria casos de teste com diferentes status para testar o fluxo completo"""

    # Dados para casos de teste
    BANCOS = ["Bradesco", "Itaú", "Caixa Econômica", "Banco do Brasil", "Santander", "Sicoob"]
    ORGAOS = ["INSS", "Governo do Estado", "Prefeitura Municipal", "Ministério da Defesa", "Tribunal de Justiça"]

    CLIENTES_TESTE = [
        ("João Silva Santos", "12345678901", "MAT001", "INSS"),
        ("Maria Oliveira Costa", "23456789012", "MAT002", "Governo do Estado"),
        ("Pedro Almeida Lima", "34567890123", "MAT003", "Prefeitura Municipal"),
        ("Ana Santos Pereira", "45678901234", "MAT004", "INSS"),
        ("Carlos Ferreira Rocha", "56789012345", "MAT005", "Ministério da Defesa"),
        ("Luciana Ribeiro Silva", "67890123456", "MAT006", "Tribunal de Justiça"),
        ("Roberto Costa Alves", "78901234567", "MAT007", "INSS"),
        ("Fernanda Lima Santos", "89012345678", "MAT008", "Governo do Estado"),
        ("José Pereira Souza", "90123456789", "MAT009", "Prefeitura Municipal"),
        ("Mariana Alves Costa", "01234567890", "MAT010", "INSS"),
        ("Antonio Silva Lima", "11223344556", "MAT011", "Ministério da Defesa"),
        ("Patrícia Santos Rocha", "22334455667", "MAT012", "Tribunal de Justiça"),
        ("Ricardo Oliveira Silva", "33445566778", "MAT013", "INSS"),
        ("Juliana Costa Santos", "44556677889", "MAT014", "Governo do Estado"),
        ("Marcos Pereira Lima", "55667788990", "MAT015", "Prefeitura Municipal"),
        ("Sandra Almeida Costa", "66778899001", "MAT016", "INSS"),
        ("Daniel Santos Silva", "77889900112", "MAT017", "Ministério da Defesa"),
        ("Cristina Lima Pereira", "88990011223", "MAT018", "Tribunal de Justiça"),
    ]

    with SessionLocal() as db:
        # Buscar usuários para atribuição
        users = db.query(User).all()
        atendentes = [u for u in users if u.role in ["atendente", "supervisor", "admin"]]

        casos_criados = 0

        for i, (nome, cpf, matricula, orgao) in enumerate(CLIENTES_TESTE):
            # Verificar se cliente já existe
            cliente_existente = db.query(Client).filter(Client.cpf == cpf).first()
            if cliente_existente:
                continue

            # Criar cliente
            client = Client(
                name=nome,
                cpf=cpf,
                matricula=matricula,
                orgao=orgao,
                telefone_preferencial=f"(11) 9{random.randint(1000,9999)}-{random.randint(1000,9999)}",
                numero_cliente=f"CLI{random.randint(1000,9999)}",
                observacoes=f"Cliente {nome} - Teste automático",
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            )
            db.add(client)
            db.flush()  # Para obter o ID

            # Definir status baseado no índice para variedade
            if i < 6:  # Primeiros 6 casos - disponíveis (não atribuídos)
                status = "novo"
                assigned_user = None
            elif i < 9:  # 3 casos em atendimento atribuídos
                status = "em_atendimento"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 13:  # 4 casos pendentes no calculista
                status = "calculista_pendente"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 16:  # 3 casos aprovados
                status = "aprovado"
                assigned_user = random.choice(atendentes) if atendentes else None
            else:  # Restantes finalizados
                status = "finalizado"
                assigned_user = random.choice(atendentes) if atendentes else None

            # Criar caso
            case = Case(
                client_id=client.id,
                status=status,
                assigned_user_id=assigned_user.id if assigned_user else None,
                banco=random.choice(BANCOS),
                created_at=client.created_at + timedelta(hours=random.randint(1, 24)),
                last_update_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            )
            db.add(case)
            casos_criados += 1

        db.commit()
        print(f"✅ {casos_criados} casos de teste criados com sucesso!")

        # Relatório dos casos criados
        print("\n📊 Distribuição dos casos:")
        for status in ["novo", "em_atendimento", "calculista_pendente", "aprovado", "finalizado"]:
            count = db.query(Case).filter(Case.status == status).count()
            print(f"  - {status}: {count} casos")

        unassigned_count = db.query(Case).filter(Case.assigned_user_id.is_(None)).count()
        print(f"  - Não atribuídos: {unassigned_count} casos")

if __name__ == "__main__":
    for name,email,role in DEMO:
        upsert_user(name,email,role)
    print("Demo users ensured.")

    # Criar casos de teste
    create_demo_cases()