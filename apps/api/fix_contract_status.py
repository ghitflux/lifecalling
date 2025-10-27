"""
Script para corrigir status de contratos que estão inconsistentes com o status do caso.

Atualiza contratos que estão "ativo" mas cujos casos estão:
- "devolvido_financeiro" -> contrato deve ser "encerrado"
- "caso_cancelado" -> contrato deve ser "encerrado"
- "contrato_cancelado" -> contrato deve ser "encerrado"

Execute com: python -m app.fix_contract_status
"""

from app.db import SessionLocal
from app.models import Case, Contract, now_brt


def fix_contract_statuses():
    """Corrige status de contratos inconsistentes"""
    with SessionLocal() as db:
        # Buscar casos com status que requerem contrato encerrado
        cases_to_close = db.query(Case).filter(
            Case.status.in_([
                "devolvido_financeiro",
                "caso_cancelado",
                "contrato_cancelado"
            ])
        ).all()

        updated_count = 0
        for case in cases_to_close:
            # Buscar contrato associado
            contract = db.query(Contract).filter(
                Contract.case_id == case.id
            ).first()

            if contract and contract.status != "encerrado":
                print(
                    f"[FIX] Caso #{case.id} ({case.status}) -> "
                    f"Contrato #{contract.id} ({contract.status} -> encerrado)"
                )
                contract.status = "encerrado"
                contract.updated_at = now_brt()
                updated_count += 1

        db.commit()
        print(f"\n[RESULTADO] {updated_count} contrato(s) atualizado(s)")

        # Buscar casos com status financeiro_pendente após reabertura
        cases_reopened = db.query(Case).filter(
            Case.status == "financeiro_pendente"
        ).all()

        updated_revision_count = 0
        for case in cases_reopened:
            contract = db.query(Contract).filter(
                Contract.case_id == case.id
            ).first()

            if contract and contract.status == "ativo":
                # Verificar se foi reaberto (tem evento de reabertura)
                from app.models import CaseEvent
                reopen_event = db.query(CaseEvent).filter(
                    CaseEvent.case_id == case.id,
                    CaseEvent.type == "finance.reopened"
                ).first()

                if reopen_event:
                    print(
                        f"[FIX] Caso #{case.id} (reaberto) -> "
                        f"Contrato #{contract.id} (ativo -> em_revisao)"
                    )
                    contract.status = "em_revisao"
                    contract.updated_at = now_brt()
                    updated_revision_count += 1

        db.commit()
        print(
            f"[RESULTADO] {updated_revision_count} contrato(s) "
            f"marcado(s) como em_revisao"
        )

        return updated_count + updated_revision_count


if __name__ == "__main__":
    print("=== Iniciando correção de status de contratos ===\n")
    total = fix_contract_statuses()
    print(f"\n=== Finalizado! Total de {total} correções ===")
