#!/usr/bin/env python3
"""Script para debug do estado dos casos"""

import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db import SessionLocal
from app.models import Case, Simulation

def main():
    with SessionLocal() as db:
        print("=== DEBUG DOS CASOS ===")

        # Casos com cálculo aprovado (deveriam estar no fechamento)
        calculo_aprovado = db.query(Case).filter(Case.status == "calculo_aprovado").all()
        print(f"\n📊 Casos com CÁLCULO APROVADO (devem aparecer no fechamento): {len(calculo_aprovado)}")
        for case in calculo_aprovado:
            print(f"  - Caso #{case.id}: status={case.status}, client_id={case.client_id}")

        # Casos com fechamento aprovado (deveriam estar no financeiro)
        fechamento_aprovado = db.query(Case).filter(Case.status == "fechamento_aprovado").all()
        print(f"\n💰 Casos com FECHAMENTO APROVADO (devem aparecer no financeiro): {len(fechamento_aprovado)}")
        for case in fechamento_aprovado:
            print(f"  - Caso #{case.id}: status={case.status}, client_id={case.client_id}")

        # Simulações aprovadas
        simulations_approved = db.query(Simulation).filter(Simulation.status == "approved").all()
        print(f"\n✅ Simulações APROVADAS: {len(simulations_approved)}")
        for sim in simulations_approved:
            case = db.get(Case, sim.case_id)
            print(f"  - Simulação #{sim.id}, Caso #{sim.case_id}: case_status={case.status if case else 'NOT_FOUND'}")

        # Todos os status
        all_statuses = db.query(Case.status, db.func.count(Case.id)).group_by(Case.status).all()
        print(f"\n📈 TODOS OS STATUS:")
        for status, count in all_statuses:
            print(f"  - {status}: {count} casos")

if __name__ == "__main__":
    main()