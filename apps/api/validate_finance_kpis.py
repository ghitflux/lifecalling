"""
Script para validar KPIs financeiros
"""
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from app.db import SessionLocal
from app.models import User, Case, Client, Simulation, FinanceExpense

def create_test_data():
    """Cria dados de teste para validação"""
    with SessionLocal() as db:
        print("\n[+] Criando dados de teste...\n")

        # Verificar se já existe admin
        admin = db.query(User).filter(User.email == "admin@lifecalling.com").first()
        if not admin:
            print("[X] Usuario admin nao encontrado. Execute o seed primeiro.")
            return False

        print(f"[OK] Usuario admin encontrado: {admin.name}")

        # Criar cliente de teste
        test_client = db.query(Client).filter(Client.cpf == "99999999999").first()
        if not test_client:
            test_client = Client(
                name="Cliente Teste KPI",
                cpf="99999999999",
                matricula="TEST001",
                orgao="INSS"
            )
            db.add(test_client)
            db.flush()
            print(f"[OK] Cliente criado: {test_client.name}")
        else:
            print(f"[OK] Cliente já existe: {test_client.name}")

        # Criar caso de teste
        test_case = db.query(Case).filter(Case.client_id == test_client.id).first()
        if not test_case:
            test_case = Case(
                client_id=test_client.id,
                status="calculo_aprovado",
                created_at=datetime.utcnow(),
                last_update_at=datetime.utcnow()
            )
            db.add(test_case)
            db.flush()
            print(f"[OK] Caso criado: #{test_case.id}")
        else:
            print(f"[OK] Caso já existe: #{test_case.id}")

        # Criar simulação aprovada
        test_sim = db.query(Simulation).filter(Simulation.case_id == test_case.id).first()
        if not test_sim:
            test_sim = Simulation(
                case_id=test_case.id,
                status="approved",
                prazo=60,
                coeficiente="2.5",
                seguro=Decimal("1500.00"),
                percentual_consultoria=Decimal("10.00"),
                valor_parcela_total=Decimal("1200.00"),
                saldo_total=Decimal("50000.00"),
                liberado_total=Decimal("45000.00"),
                total_financiado=Decimal("72000.00"),
                valor_liquido=Decimal("70500.00"),
                custo_consultoria=Decimal("7000.00"),
                custo_consultoria_liquido=Decimal("6020.00"),  # 86% de 7000
                liberado_cliente=Decimal("38000.00"),
                created_by=admin.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(test_sim)
            db.commit()
            print(f"[OK] Simulação aprovada criada: #{test_sim.id}")
            print(f"   - Custo Consultoria: R$ {float(test_sim.custo_consultoria):,.2f}")
            print(f"   - Consultoria Líquida (86%): R$ {float(test_sim.custo_consultoria_liquido):,.2f}")
        else:
            print(f"[OK] Simulação já existe: #{test_sim.id}")

        # Criar despesa do mês atual
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year

        test_expense = db.query(FinanceExpense).filter(
            FinanceExpense.month == current_month,
            FinanceExpense.year == current_year
        ).first()

        if not test_expense:
            test_expense = FinanceExpense(
                month=current_month,
                year=current_year,
                amount=Decimal("5000.00"),
                description="Despesas operacionais de teste: salários, infraestrutura, marketing",
                created_by=admin.id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(test_expense)
            db.commit()
            print(f"[OK] Despesa criada para {current_month}/{current_year}")
            print(f"   - Valor: R$ {float(test_expense.amount):,.2f}")
        else:
            print(f"[OK] Despesa já existe para {current_month}/{current_year}")
            print(f"   - Valor: R$ {float(test_expense.amount):,.2f}")

        return True

def validate_kpis():
    """Valida cálculos dos KPIs"""
    with SessionLocal() as db:
        print("\n[+] Validando KPIs Financeiros...\n")

        # Buscar simulações aprovadas dos últimos 30 dias
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        approved_simulations = db.query(Simulation).filter(
            Simulation.status == "approved",
            Simulation.updated_at >= thirty_days_ago
        ).all()

        print(f"[>] Simulacoes aprovadas (ultimos 30 dias): {len(approved_simulations)}")

        if not approved_simulations:
            print("[!]  Nenhuma simulação aprovada encontrada!")
            return

        # Calcular totais
        total_consultoria = sum([float(sim.custo_consultoria or 0) for sim in approved_simulations])

        # Debug: mostrar simulações
        print(f"\nDebug: Simulacoes encontradas:")
        for sim in approved_simulations:
            print(f"  - Simulacao #{sim.id}: Consultoria Bruta=R$ {float(sim.custo_consultoria or 0):.2f}, Liquida=R$ {float(sim.custo_consultoria_liquido or 0):.2f}")

        total_consultoria_liquida = sum([float(sim.custo_consultoria_liquido or 0) for sim in approved_simulations])

        # Imposto: 14% da consultoria
        total_tax = total_consultoria * 0.14

        # Receitas = consultoria líquida
        total_revenue = total_consultoria_liquida

        # Buscar despesas do mês atual
        current_month = datetime.utcnow().month
        current_year = datetime.utcnow().year

        expense_record = db.query(FinanceExpense).filter(
            FinanceExpense.month == current_month,
            FinanceExpense.year == current_year
        ).first()

        total_expenses = float(expense_record.amount) if expense_record else 0

        # Lucro líquido = Receitas - Despesas - Impostos
        net_profit = total_revenue - total_expenses - total_tax

        # Exibir resultados
        print("\n[$$] RESUMO FINANCEIRO (Ultimos 30 dias):")
        print("=" * 60)
        print(f"Total Consultoria Bruta:    R$ {total_consultoria:>12,.2f}")
        print(f"Imposto (14%):              R$ {total_tax:>12,.2f}")
        print(f"Consultoria Líquida (86%):  R$ {total_consultoria_liquida:>12,.2f}")
        print("-" * 60)
        print(f"Receitas Totais:            R$ {total_revenue:>12,.2f}")
        print(f"Despesas Totais:            R$ {total_expenses:>12,.2f}")
        print("=" * 60)
        print(f"Lucro Líquido:              R$ {net_profit:>12,.2f}")
        print("=" * 60)

        # Validações
        print("\n[OK] VALIDAÇÕES:")

        # 1. Imposto deve ser 14% da consultoria
        expected_tax = total_consultoria * 0.14
        tax_ok = abs(total_tax - expected_tax) < 0.01
        print(f"{'[OK]' if tax_ok else '[X]'} Imposto = 14% da consultoria: {tax_ok}")

        # 2. Consultoria líquida deve ser 86% da consultoria
        expected_liquida = total_consultoria * 0.86
        liquida_ok = abs(total_consultoria_liquida - expected_liquida) < 0.01
        print(f"{'[OK]' if liquida_ok else '[X]'} Consultoria líquida = 86% da bruta: {liquida_ok}")

        # 3. Receitas = Consultoria líquida
        revenue_ok = abs(total_revenue - total_consultoria_liquida) < 0.01
        print(f"{'[OK]' if revenue_ok else '[X]'} Receitas = Consultoria líquida: {revenue_ok}")

        # 4. Lucro = Receitas - Despesas - Impostos
        expected_profit = total_revenue - total_expenses - total_tax
        profit_ok = abs(net_profit - expected_profit) < 0.01
        print(f"{'[OK]' if profit_ok else '[X]'} Lucro calculado corretamente: {profit_ok}")

        if tax_ok and liquida_ok and revenue_ok and profit_ok:
            print("\n[+] Todos os KPIs estao corretos!")
            return True
        else:
            print("\n[!]  Alguns KPIs apresentam inconsistencias")
            return False

if __name__ == "__main__":
    print("=== Validacao de KPIs Financeiros ===")
    print("=" * 60)

    # Criar dados de teste
    if create_test_data():
        # Validar KPIs
        if validate_kpis():
            print("\n[OK] Validacao concluida com sucesso!")
            sys.exit(0)
        else:
            print("\n[X] Validacao falhou!")
            sys.exit(1)
    else:
        print("\n[X] Erro ao criar dados de teste")
        sys.exit(1)
