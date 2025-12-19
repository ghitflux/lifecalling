"""
Script de limpeza retroativa de casos parados sem interação.

Este script executa UMA ÚNICA VEZ para processar casos históricos que:
- Estão com status "em_atendimento"
- Passaram de 48h úteis desde a atribuição
- Não tiveram nenhuma interação (comentários, anexos, telefones)

Uso:
    python cleanup_stalled_cases.py [--dry-run]

Flags:
    --dry-run: Apenas mostra o que seria feito, sem alterar o banco
"""

import sys
import os
import csv
from datetime import datetime

# Adicionar o diretório app ao path para importar módulos
sys.path.insert(0, os.path.dirname(__file__))

from app.db import SessionLocal
from app.models import Case, Client, User, CaseEvent, Comment, Attachment, ClientPhone, now_brt, BRT
from app.services.case_scheduler import CaseScheduler


def generate_report(cases_to_process, output_file='cleanup_report.csv'):
    """Gera relatório CSV dos casos que serão processados"""
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([
            'Case ID',
            'Cliente',
            'CPF',
            'Status',
            'Atendente',
            'Atendente ID',
            'Atribuído em',
            'Dias parado',
            'Teve interação?',
            'Motivo'
        ])

        for case_info in cases_to_process:
            writer.writerow([
                case_info['case_id'],
                case_info['client_name'],
                case_info['client_cpf'],
                case_info['status'],
                case_info['assigned_user'],
                case_info['assigned_user_id'],
                case_info['assigned_at'],
                case_info['days_stalled'],
                'Sim' if case_info['had_interaction'] else 'Não',
                case_info['reason']
            ])

    print(f"\n[OK] Relatório gerado: {output_file}")


def cleanup_stalled_cases(dry_run=False):
    """
    Limpa casos parados sem interação.

    Args:
        dry_run: Se True, apenas mostra o que seria feito sem alterar dados
    """
    db = SessionLocal()
    scheduler = CaseScheduler(db)

    print("=" * 80)
    print("SCRIPT DE LIMPEZA RETROATIVA DE CASOS PARADOS")
    print("=" * 80)
    print(f"Modo: {'DRY RUN (sem alterações)' if dry_run else 'EXECUÇÃO REAL'}")
    print(f"Executado em: {now_brt().strftime('%d/%m/%Y %H:%M:%S')}")
    print()

    try:
        # Buscar todos os casos em atendimento com atribuição
        cases_in_progress = db.query(Case).filter(
            Case.status == "em_atendimento",
            Case.assigned_user_id.isnot(None),
            Case.assigned_at.isnot(None)
        ).all()

        print(f"[INFO] Total de casos em atendimento: {len(cases_in_progress)}")
        print()

        # Analisar cada caso
        cases_to_process = []
        now = now_brt()

        for case in cases_in_progress:
            # Calcular tempo desde atribuição
            if case.assigned_at:
                # Converter para timezone-aware se necessário
                assigned_at = case.assigned_at.replace(tzinfo=BRT) if case.assigned_at.tzinfo is None else case.assigned_at
                days_stalled = (now - assigned_at).days
            else:
                days_stalled = 0

            # Verificar interação
            had_interaction = scheduler.has_case_interaction(case.id, case.assigned_at) if case.assigned_at else False

            # Buscar dados do usuário
            user = db.query(User).get(case.assigned_user_id)
            user_name = user.name if user else "Usuário removido"

            # Buscar dados do cliente
            client = db.query(Client).get(case.client_id)
            client_name = client.name if client else "Cliente desconhecido"
            client_cpf = client.cpf if client else ""

            # Determinar se deve processar
            should_process = False
            reason = ""

            # Critério 1: Mais de 2 dias (48h) sem interação
            if days_stalled >= 2 and not had_interaction:
                should_process = True
                reason = "Mais de 48h sem nenhuma interação"

            # Critério 2: Mais de 7 dias mesmo com interação
            elif days_stalled >= 7:
                should_process = True
                reason = "Mais de 7 dias parado (limite máximo)"

            if should_process:
                cases_to_process.append({
                    'case': case,
                    'case_id': case.id,
                    'client_name': client_name,
                    'client_cpf': client_cpf,
                    'status': case.status,
                    'assigned_user': user_name,
                    'assigned_user_id': case.assigned_user_id,
                    'assigned_at': case.assigned_at.strftime('%d/%m/%Y %H:%M') if case.assigned_at else '',
                    'days_stalled': days_stalled,
                    'had_interaction': had_interaction,
                    'reason': reason
                })

        print(f"[SEARCH] Casos a processar: {len(cases_to_process)}")
        print()

        if len(cases_to_process) == 0:
            print("[OK] Nenhum caso precisa ser processado!")
            return

        # Mostrar preview
        print("[LIST] PREVIEW DOS CASOS A SEREM PROCESSADOS:")
        print("-" * 80)
        for i, info in enumerate(cases_to_process[:10], 1):  # Mostrar apenas os primeiros 10
            print(f"{i}. Caso #{info['case_id']} - {info['client_name']}")
            print(f"   Atendente: {info['assigned_user']}")
            print(f"   Parado há: {info['days_stalled']} dias")
            print(f"   Motivo: {info['reason']}")
            print()

        if len(cases_to_process) > 10:
            print(f"... e mais {len(cases_to_process) - 10} casos")
            print()

        # Gerar relatório CSV sempre
        generate_report(cases_to_process)

        if dry_run:
            print("\n[WARNING]  DRY RUN - Nenhuma alteração foi feita no banco de dados")
            print(f"[OK] Total de casos que SERIAM processados: {len(cases_to_process)}")
            return

        # Perguntar confirmação
        print("\n" + "=" * 80)
        print("[WARNING]  ATENÇÃO: Esta operação irá:")
        print("   1. Remover a atribuição dos casos listados")
        print("   2. Mudar o status para 'novo'")
        print("   3. Criar eventos de expiração no histórico")
        print("=" * 80)
        confirm = input("\nDeseja continuar? (digite 'SIM' para confirmar): ")

        if confirm != 'SIM':
            print("\n[ERROR] Operação cancelada pelo usuário")
            return

        # Processar casos
        print("\n[PROCESSING] Processando casos...")
        processed = 0
        errors = 0

        for info in cases_to_process:
            case = info['case']
            try:
                # Salvar histórico
                if not case.assignment_history:
                    case.assignment_history = []

                case.assignment_history.append({
                    "user_id": case.assigned_user_id,
                    "user_name": info['assigned_user'],
                    "assigned_at": case.assigned_at.isoformat() if case.assigned_at else None,
                    "expired_at": now.isoformat(),
                    "action": "cleanup_script",
                    "reason": info['reason']
                })

                # Resetar atribuição
                original_user_id = case.assigned_user_id
                case.assigned_user_id = None
                case.status = "novo"
                case.assigned_at = None
                case.assignment_expires_at = None
                case.last_update_at = now

                # Criar evento
                event = CaseEvent(
                    case_id=case.id,
                    type="case.cleanup_script",
                    payload={
                        "original_user_id": original_user_id,
                        "cleaned_at": now.isoformat(),
                        "reason": info['reason'],
                        "days_stalled": info['days_stalled'],
                        "had_interaction": info['had_interaction']
                    },
                    created_by=None  # Script automático
                )
                db.add(event)

                processed += 1

                if processed % 10 == 0:
                    print(f"   Processados: {processed}/{len(cases_to_process)}")

            except Exception as e:
                errors += 1
                print(f"   [ERROR] Erro no caso #{case.id}: {str(e)}")

        # Commit
        db.commit()

        print("\n" + "=" * 80)
        print("[OK] LIMPEZA CONCLUÍDA!")
        print("=" * 80)
        print(f"📊 Casos processados: {processed}")
        print(f"[ERROR] Erros: {errors}")
        print(f"[FILE] Relatório: cleanup_report.csv")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] ERRO FATAL: {str(e)}")
        import traceback
        traceback.print_exc()

    finally:
        db.close()


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv

    cleanup_stalled_cases(dry_run=dry_run)
