"""
Seeds aprimorados para testar o sistema multi-bancos completo
Inclui dados realísticos com simulações multi-bancos e notificações
"""
from datetime import datetime, timedelta
from app.db import SessionLocal
from app.models import User, Client, Case, CaseEvent, Simulation, Contract, Payment, ContractAttachment, Attachment, Notification
from app.security import hash_password
import random
from decimal import Decimal

# Dados expandidos para maior variedade
CLIENTES_EXPANSIVO = [
    # Clientes para diferentes cenários de teste
    ("Maria da Conceição Silva", "12345678901", "MAT001-X", "INSS", "(11) 98765-4321"),
    ("José Roberto dos Santos", "23456789012", "MAT002-2", "Governo do Estado", "(11) 97654-3210"),
    ("Ana Lúcia Ferreira Costa", "34567890123", "MAT003-5", "Prefeitura Municipal", "(11) 96543-2109"),
    ("Carlos Eduardo Oliveira", "45678901234", "MAT004-1", "INSS", "(11) 95432-1098"),
    ("Francisca de Assis Lima", "56789012345", "MAT005-9", "Ministério da Defesa", "(11) 94321-0987"),
    ("Luiz Antonio Rocha Neto", "67890123456", "MAT006-7", "Tribunal de Justiça", "(11) 93210-9876"),
    ("Helena Maria dos Santos", "78901234567", "MAT007-4", "INSS", "(11) 92109-8765"),
    ("João Batista Alves Silva", "89012345678", "MAT008-8", "Governo do Estado", "(11) 91098-7654"),
    ("Rosa de Souza Pereira", "90123456789", "MAT009-3", "Prefeitura Municipal", "(11) 90987-6543"),
    ("Antônio Carlos Moreira", "01234567890", "MAT010-6", "INSS", "(11) 89876-5432"),
    ("Vera Lúcia Nascimento", "11234567890", "MAT011-2", "Governo do Estado", "(11) 88765-4321"),
    ("Manuel José da Silva", "21234567890", "MAT012-0", "INSS", "(11) 87654-3210"),
    ("Carmem Miranda Souza", "31234567890", "MAT013-4", "Prefeitura Municipal", "(11) 86543-2109"),
    ("Sebastião Ferreira Lima", "41234567890", "MAT014-7", "INSS", "(11) 85432-1098"),
    ("Aparecida Santos Costa", "51234567890", "MAT015-1", "Governo do Estado", "(11) 84321-0987"),
    ("Raimundo Nonato Alves", "61234567890", "MAT016-5", "INSS", "(11) 83210-9876"),
    ("Marlene Pereira Silva", "71234567890", "MAT017-8", "Tribunal de Justiça", "(11) 82109-8765"),
    ("Francisco das Chagas", "81234567890", "MAT018-2", "INSS", "(11) 81098-7654"),
    ("Terezinha Jesus Santos", "91234567890", "MAT019-6", "Governo do Estado", "(11) 80987-6543"),
    ("João Maria dos Santos", "12334567890", "MAT020-9", "INSS", "(11) 79876-5432"),
    # Novos clientes para mais cenários
    ("Benedito Silva Oliveira", "12445678901", "MAT021-3", "INSS", "(11) 78765-4321"),
    ("Lurdes Ferreira Santos", "23556789012", "MAT022-7", "Prefeitura Municipal", "(11) 77654-3210"),
    ("Geraldo Pereira Costa", "34667890123", "MAT023-1", "Governo do Estado", "(11) 76543-2109"),
    ("Neuza Lima Alves", "45778901234", "MAT024-5", "INSS", "(11) 75432-1098"),
    ("Osvaldo Santos Silva", "56889012345", "MAT025-9", "Tribunal de Justiça", "(11) 74321-0987"),
    ("Lourdes Costa Ferreira", "67990123456", "MAT026-2", "INSS", "(11) 73210-9876"),
    ("Expedito Alves Santos", "78001234567", "MAT027-6", "Governo do Estado", "(11) 72109-8765"),
    ("Zilda Silva Costa", "89112345678", "MAT028-0", "Prefeitura Municipal", "(11) 71098-7654"),
    ("Waldemar Santos Lima", "90223456789", "MAT029-4", "INSS", "(11) 70987-6543"),
    ("Ivete Ferreira Silva", "01334567890", "MAT030-8", "Ministério da Defesa", "(11) 69876-5432"),
]

# Bancos disponíveis no sistema
BANCOS_SISTEMA = [
    "SANTANDER", "BRADESCO", "ITAU", "BANCO_DO_BRASIL",
    "CAIXA", "SICOOB", "SICREDI", "PAN", "ORIGINAL"
]

# Status dos casos com distribuição mais realística
STATUS_DISTRIBUICAO = [
    ("novo", 25),                    # 25% - Casos novos
    ("em_atendimento", 20),         # 20% - Em atendimento
    ("calculista_pendente", 15),    # 15% - Aguardando calculista
    ("calculo_aprovado", 20),       # 20% - Cálculo aprovado
    ("fechamento_aprovado", 12),    # 12% - Fechamento aprovado
    ("contrato_efetivado", 8),      # 8%  - Contratos efetivados
]

def ensure_enhanced_users():
    """Cria usuários com funções específicas para teste"""
    usuarios_demo = [
        ("Carlos Admin Geral", "admin@lifecalling.com", "admin"),
        ("Sara Supervisora Master", "supervisor@lifecalling.com", "supervisor"),
        ("Fábio Financeiro Expert", "financeiro@lifecalling.com", "financeiro"),
        ("Cida Calculista Senior", "calculista@lifecalling.com", "calculista"),
        ("Ana Atendente Pleno", "atendente@lifecalling.com", "atendente"),
        ("Marcos Atendente Junior", "marcos.atendente@lifecalling.com", "atendente"),
        ("Julia Supervisora Regional", "julia.supervisor@lifecalling.com", "supervisor"),
        ("Pedro Calculista Expert", "pedro.calculista@lifecalling.com", "calculista"),
        ("Luciana Atendente Senior", "luciana.atendente@lifecalling.com", "atendente"),
        ("Roberto Financeiro Pleno", "roberto.financeiro@lifecalling.com", "financeiro"),
    ]

    with SessionLocal() as db:
        for name, email, role in usuarios_demo:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    name=name,
                    email=email,
                    role=role,
                    password_hash=hash_password("demo123"),
                    created_at=datetime.utcnow()
                )
                db.add(user)
        db.commit()
        print("[OK] Usuários demo criados/atualizados")

def clear_existing_test_data():
    """Limpa dados de teste existentes"""
    with SessionLocal() as db:
        # Buscar clientes de teste
        test_clients = db.query(Client).filter(
            Client.matricula.like("MAT%")
        ).all()

        print(f"[CLEANUP] Removendo {len(test_clients)} clientes de teste existentes...")

        for client in test_clients:
            # Remover casos e suas dependências
            cases = db.query(Case).filter(Case.client_id == client.id).all()
            for case in cases:
                # Remover notificações - usar SQL direto para PostgreSQL JSON
                try:
                    db.execute(
                        "DELETE FROM notifications WHERE payload::text LIKE :pattern",
                        {"pattern": f'%"case_id": {case.id}%'}
                    )
                except Exception:
                    # Se falhar, skip - as notificações serão limpas de outra forma
                    pass

                # Remover eventos
                db.query(CaseEvent).filter(CaseEvent.case_id == case.id).delete()

                # Remover simulações
                db.query(Simulation).filter(Simulation.case_id == case.id).delete()

                # Remover anexos
                db.query(Attachment).filter(Attachment.case_id == case.id).delete()

                # Remover contratos e dependências
                contracts = db.query(Contract).filter(Contract.case_id == case.id).all()
                for contract in contracts:
                    db.query(Payment).filter(Payment.contract_id == contract.id).delete()
                    db.query(ContractAttachment).filter(ContractAttachment.contract_id == contract.id).delete()
                    db.delete(contract)

                db.delete(case)

            db.delete(client)

        db.commit()
        print("[OK] Dados de teste antigos removidos")

def create_multi_bank_simulation_data(case_id, user_id, status="draft"):
    """Cria dados de simulação multi-bancos realísticos"""

    # Determinar número de bancos (1-4)
    num_banks = random.randint(1, 4)
    banks_data = []

    for i in range(num_banks):
        bank = random.choice(BANCOS_SISTEMA)
        # Evitar bancos duplicados
        while any(b["bank"] == bank for b in banks_data):
            bank = random.choice(BANCOS_SISTEMA)

        parcela = random.randint(800, 2500)
        saldo_devedor = random.randint(15000, 45000)
        coeficiente = round(random.uniform(0.015, 0.025), 7)
        valor_liberado = max(0, (parcela / coeficiente) - saldo_devedor)

        banks_data.append({
            "bank": bank,
            "parcela": float(parcela),
            "saldoDevedor": float(saldo_devedor),
            "valorLiberado": float(valor_liberado)
        })

    # Calcular totais
    total_parcela = sum(b["parcela"] for b in banks_data)
    total_saldo = sum(b["saldoDevedor"] for b in banks_data)
    total_liberado = sum(b["valorLiberado"] for b in banks_data)

    seguro = random.randint(500, 1500)
    percentual_consultoria = random.randint(8, 15)

    total_financiado = total_saldo + total_liberado
    valor_liquido = total_liberado - seguro
    custo_consultoria = total_financiado * (percentual_consultoria / 100)
    liberado_cliente = valor_liquido - custo_consultoria

    simulation_data = {
        "banks_json": banks_data,
        "prazo": random.randint(72, 96),
        "coeficiente": f"{coeficiente:.7f}",
        "seguro": Decimal(str(seguro)),
        "percentual_consultoria": Decimal(str(percentual_consultoria)),
        "valor_parcela_total": Decimal(str(total_parcela)),
        "saldo_total": Decimal(str(total_saldo)),
        "liberado_total": Decimal(str(total_liberado)),
        "total_financiado": Decimal(str(total_financiado)),
        "valor_liquido": Decimal(str(valor_liquido)),
        "custo_consultoria": Decimal(str(custo_consultoria)),
        "liberado_cliente": Decimal(str(liberado_cliente)),
        "status": status,
        "created_by": user_id,
        "case_id": case_id
    }

    return simulation_data

def create_enhanced_cases():
    """Cria casos com dados mais realísticos e variados"""

    with SessionLocal() as db:
        # Buscar usuários por função
        atendentes = db.query(User).filter(User.role.in_(["atendente", "supervisor"])).all()
        calculistas = db.query(User).filter(User.role == "calculista").all()
        financeiros = db.query(User).filter(User.role == "financeiro").all()

        if not atendentes:
            print("❌ Usuários não encontrados. Execute ensure_enhanced_users() primeiro.")
            return

        casos_criados = 0
        agora = datetime.utcnow()

        # Criar casos para cada cliente
        for i, (nome, cpf, matricula, orgao, telefone) in enumerate(CLIENTES_EXPANSIVO):
            try:
                # Adicionar dados bancários aleatórios
                bancos_cliente = ["Banco do Brasil", "Caixa Econômica", "Santander", "Bradesco", "Itaú"]
                dados_bancarios = {
                    "banco": random.choice(bancos_cliente),
                    "agencia": f"{random.randint(1000, 9999)}",
                    "conta": f"{random.randint(10000, 99999)}-{random.randint(0, 9)}",
                    "chave_pix": cpf if random.choice([True, False]) else telefone,
                    "tipo_chave_pix": "CPF" if cpf in locals() else "TELEFONE"
                }

                # Criar cliente com dados bancários
                client = Client(
                    name=nome,
                    cpf=cpf,
                    matricula=matricula,
                    orgao=orgao,
                    telefone_preferencial=telefone,
                    numero_cliente=f"CLT{random.randint(100000, 999999)}",
                    observacoes=f"Cliente {random.choice(['premium', 'regular', 'novo'])} - Histórico: {random.choice(['excelente', 'bom', 'regular'])}",
                    **dados_bancarios
                )
                db.add(client)
                db.flush()

                # Escolher status com distribuição
                status = random.choices(
                    [s[0] for s in STATUS_DISTRIBUICAO],
                    weights=[s[1] for s in STATUS_DISTRIBUICAO]
                )[0]

                # Atribuir usuário baseado no status
                assigned_user = None
                if status in ["em_atendimento", "calculista_pendente"]:
                    assigned_user = random.choice(atendentes)
                elif status in ["calculo_aprovado", "fechamento_aprovado"]:
                    assigned_user = random.choice(atendentes)
                elif status == "contrato_efetivado":
                    assigned_user = random.choice(financeiros) if financeiros else random.choice(atendentes)

                # Datas realísticas
                days_ago = random.randint(1, 45)
                created_at = agora - timedelta(days=days_ago)
                last_update = created_at + timedelta(hours=random.randint(1, 24 * min(days_ago, 7)))

                # Criar caso
                case = Case(
                    client_id=client.id,
                    status=status,
                    assigned_user_id=assigned_user.id if assigned_user else None,
                    last_update_at=last_update
                )
                db.add(case)
                db.flush()

                # Criar simulação baseada no status
                simulation = None
                if status in ["calculista_pendente", "calculo_aprovado", "fechamento_aprovado", "contrato_efetivado"]:
                    sim_status = "draft" if status == "calculista_pendente" else "approved"
                    sim_data = create_multi_bank_simulation_data(
                        case.id,
                        calculistas[0].id if calculistas else assigned_user.id,
                        sim_status
                    )

                    simulation = Simulation(**sim_data)
                    simulation.created_at = created_at + timedelta(hours=random.randint(2, 48))
                    simulation.updated_at = last_update
                    db.add(simulation)

                    if sim_status == "approved":
                        case.last_simulation_id = simulation.id

                # Criar contrato para casos efetivados
                if status == "contrato_efetivado" and simulation:
                    db.flush()
                    contract = Contract(
                        case_id=case.id,
                        total_amount=float(simulation.liberado_cliente),
                        installments=simulation.prazo,
                        status="ativo",
                        created_at=last_update,
                        updated_at=last_update
                    )
                    db.add(contract)

                # Criar algumas notificações para simular atividade
                if random.choice([True, False]) and assigned_user:
                    notification_events = [
                        "simulation.approved",
                        "simulation.rejected",
                        "case.assigned",
                        "case.status_changed"
                    ]

                    notification = Notification(
                        user_id=assigned_user.id,
                        event=random.choice(notification_events),
                        payload={
                            "case_id": case.id,
                            "message": f"Atualização no caso #{case.id} - {client.name}"
                        },
                        is_read=random.choice([True, False]),
                        created_at=last_update
                    )
                    db.add(notification)

                casos_criados += 1

                # Commit a cada 10 casos
                if casos_criados % 10 == 0:
                    db.commit()
                    print(f"[PROGRESS] {casos_criados} casos criados...")

            except Exception as e:
                print(f"[ERROR] Erro ao criar caso para {nome}: {e}")
                db.rollback()

        # Commit final
        db.commit()
        print(f"[OK] Total de {casos_criados} casos criados com sucesso!")

        # Estatísticas detalhadas
        print("\n[STATS] Estatísticas dos casos criados:")
        for status, _ in STATUS_DISTRIBUICAO:
            count = db.query(Case).filter(Case.status == status).count()
            sims_count = db.query(Simulation).join(Case, Simulation.case_id == Case.id).filter(Case.status == status).count()
            print(f"  - {status}: {count} casos ({sims_count} com simulação)")

        print("\n[SIMS] Simulações multi-bancos:")
        total_sims = db.query(Simulation).count()
        draft_sims = db.query(Simulation).filter(Simulation.status == "draft").count()
        approved_sims = db.query(Simulation).filter(Simulation.status == "approved").count()
        print(f"  - Total: {total_sims}")
        print(f"  - Draft (pendentes): {draft_sims}")
        print(f"  - Aprovadas: {approved_sims}")

        print("\n[USERS] Casos por usuário:")
        for user in atendentes + calculistas + financeiros:
            count = db.query(Case).filter(Case.assigned_user_id == user.id).count()
            notif_count = db.query(Notification).filter(Notification.user_id == user.id).count()
            print(f"  - {user.name} ({user.role}): {count} casos, {notif_count} notificações")

        unassigned = db.query(Case).filter(Case.assigned_user_id.is_(None)).count()
        print(f"  - Não atribuídos: {unassigned} casos")

def run_enhanced_seed():
    """Executa o processo completo de criação de seeds aprimorados"""
    print("[SEED] Iniciando criação de seeds aprimorados...")
    print("=" * 60)

    try:
        # 1. Criar usuários
        print("[1] Criando usuários demo...")
        ensure_enhanced_users()

        # 2. Limpar dados antigos
        print("\n[2] Limpando dados de teste antigos...")
        clear_existing_test_data()

        # 3. Criar novos dados
        print("\n[3] Criando casos com simulações multi-bancos...")
        create_enhanced_cases()

        print("\n" + "=" * 60)
        print("[OK] Seeds aprimorados criados com sucesso!")
        print("[INFO] Acesse: http://localhost:3002")
        print("[LOGIN] admin@lifecalling.com / demo123")

    except Exception as e:
        print(f"\n[ERROR] Erro durante criação dos seeds: {e}")
        raise

if __name__ == "__main__":
    run_enhanced_seed()
