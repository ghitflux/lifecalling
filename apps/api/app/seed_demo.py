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
        ("Maria Conceição Silva", "12345678901", "MAT001", "INSS"),
        ("José Roberto Santos", "23456789012", "MAT002", "Governo do Estado"),
        ("Ana Lúcia Ferreira", "34567890123", "MAT003", "Prefeitura Municipal"),
        ("Carlos Eduardo Costa", "45678901234", "MAT004", "INSS"),
        ("Francisca Oliveira", "56789012345", "MAT005", "Ministério da Defesa"),
        ("Luiz Antonio Rocha", "67890123456", "MAT006", "Tribunal de Justiça"),
        ("Helena Maria Lima", "78901234567", "MAT007", "INSS"),
        ("João Batista Alves", "89012345678", "MAT008", "Governo do Estado"),
        ("Rosa de Souza", "90123456789", "MAT009", "Prefeitura Municipal"),
        ("Pedro Paulo Dias", "01234567890", "MAT010", "INSS"),
        ("Antonia Pereira", "11223344556", "MAT011", "Ministério da Defesa"),
        ("Manuel dos Santos", "22334455667", "MAT012", "Tribunal de Justiça"),
        ("Célia Regina Moraes", "33445566778", "MAT013", "INSS"),
        ("Sebastião Vieira", "44556677889", "MAT014", "Governo do Estado"),
        ("Terezinha Campos", "55667788990", "MAT015", "Prefeitura Municipal"),
        ("Francisco Gomes", "66778899001", "MAT016", "INSS"),
        ("Marlene da Silva", "77889900112", "MAT017", "Ministério da Defesa"),
        ("Benedito Ribeiro", "88990011223", "MAT018", "Tribunal de Justiça"),
        ("Ivone Monteiro", "99123456780", "MAT019", "INSS"),
        ("Geraldo Cardoso", "01357924681", "MAT020", "Governo do Estado"),
        ("Aparecida Lopes", "13579024682", "MAT021", "Prefeitura Municipal"),
        ("Osvaldo Nunes", "24680135793", "MAT022", "INSS"),
        ("Vera Lúcia Pinto", "35791468024", "MAT023", "Ministério da Defesa"),
        ("Raimundo Araújo", "46802579135", "MAT024", "Tribunal de Justiça"),
        ("Neusa Barbosa", "57913680246", "MAT025", "INSS"),
        ("Waldemar Torres", "68024791357", "MAT026", "Governo do Estado"),
        ("Dulce Maria Cruz", "79135802468", "MAT027", "Prefeitura Municipal"),
        ("Valdir Machado", "80246913579", "MAT028", "INSS"),
        ("Zilda Carvalho", "91357024680", "MAT029", "Ministério da Defesa"),
        ("Agenor Freitas", "02468135791", "MAT030", "Tribunal de Justiça"),
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
                observacoes=f"Cliente {nome} - Teste automático"
            )
            db.add(client)
            db.flush()  # Para obter o ID

            # Definir status baseado no índice para variedade mais realista
            if i < 8:  # Primeiros 8 casos - disponíveis na esteira (não atribuídos)
                status = "novo"
                assigned_user = None
            elif i < 12:  # 4 casos em atendimento atribuídos
                status = "em_atendimento"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 18:  # 6 casos aguardando calculista
                status = "calculista_pendente"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 22:  # 4 casos aprovados para fechamento
                status = "aprovado"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 26:  # 4 casos atribuídos (em processamento)
                status = "atribuido"
                assigned_user = random.choice(atendentes) if atendentes else None
            elif i < 28:  # 2 casos pendentes
                status = "pendente"
                assigned_user = random.choice(atendentes) if atendentes else None
            else:  # Restantes finalizados
                status = "finalizado"
                assigned_user = random.choice(atendentes) if atendentes else None

            # Criar caso
            case = Case(
                client_id=client.id,
                status=status,
                assigned_user_id=assigned_user.id if assigned_user else None,
                last_update_at=datetime.utcnow() - timedelta(hours=random.randint(1, 72))
            )
            db.add(case)
            casos_criados += 1

        db.commit()
        print(f"✅ {casos_criados} casos de teste criados com sucesso!")

        # Relatório dos casos criados
        print("\n📊 Distribuição dos casos:")
        for status in ["novo", "em_atendimento", "calculista_pendente", "aprovado", "atribuido", "pendente", "finalizado"]:
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