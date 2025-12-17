"""
Script de teste para verificar receitas de Daniel e Carol
"""

from app.db import SessionLocal
from app.models import FinanceIncome, User

def test_receitas():
    db = SessionLocal()

    try:
        # Buscar Daniel e Carol
        daniel = db.query(User).filter(User.name.ilike("%DANIEL%")).first()
        carol = db.query(User).filter(User.name.ilike("%Carol%")).first()

        print(f"\n{'='*80}")
        print(f"TESTE DE RECEITAS - DANIEL E CAROL")
        print(f"{'='*80}\n")

        if daniel:
            print(f"✅ Daniel encontrado: ID {daniel.id}")

            receitas_daniel = db.query(FinanceIncome).filter(
                FinanceIncome.agent_user_id == daniel.id
            ).all()

            print(f"\nReceitas de Daniel:")
            total_daniel = 0
            for r in receitas_daniel:
                print(f"  - {r.income_type}: R$ {float(r.amount):.2f} ({r.income_name})")
                total_daniel += float(r.amount)
            print(f"  TOTAL: R$ {total_daniel:.2f}")

        if carol:
            print(f"\n✅ Carol encontrada: ID {carol.id}")

            receitas_carol = db.query(FinanceIncome).filter(
                FinanceIncome.agent_user_id == carol.id
            ).all()

            print(f"\nReceitas de Carol:")
            total_carol = 0
            for r in receitas_carol:
                print(f"  - {r.income_type}: R$ {float(r.amount):.2f} ({r.income_name})")
                total_carol += float(r.amount)
            print(f"  TOTAL: R$ {total_carol:.2f}")

        print(f"\n{'='*80}\n")

    finally:
        db.close()

if __name__ == "__main__":
    test_receitas()
