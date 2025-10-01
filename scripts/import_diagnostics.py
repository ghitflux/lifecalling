"""
Script de diagnóstico para verificar população da esteira e dados faltantes na importação

Este script analisa:
1. Logs de importação recentes
2. Discrepâncias entre arquivos e registros inseridos
3. População da esteira após importação
4. Dados faltantes em campos críticos
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'apps', 'api')))

from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import sessionmaker
from app.models import *
from app.config import settings
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any

# Setup database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class ImportDiagnostics:
    def __init__(self):
        self.db = SessionLocal()
        self.results = {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()

    def analyze_recent_imports(self, days=7) -> Dict[str, Any]:
        """Analisa importações dos últimos X dias"""
        since_date = datetime.utcnow() - timedelta(days=days)

        # Importações Santander
        santander_batches = self.db.query(ImportBatch).filter(
            ImportBatch.created_at >= since_date
        ).order_by(ImportBatch.created_at.desc()).all()

        # Importações Payroll
        payroll_batches = self.db.query(PayrollImportBatch).filter(
            PayrollImportBatch.processed_at >= since_date
        ).order_by(PayrollImportBatch.processed_at.desc()).all()

        return {
            "period_days": days,
            "santander_imports": len(santander_batches),
            "payroll_imports": len(payroll_batches),
            "santander_batches": [
                {
                    "id": b.id,
                    "filename": b.filename,
                    "created_at": b.created_at.isoformat(),
                    "counters": b.counters or {}
                } for b in santander_batches
            ],
            "payroll_batches": [
                {
                    "id": b.id,
                    "file_name": b.file_name,
                    "entidade": b.entidade_name,
                    "processed_at": b.processed_at.isoformat() if b.processed_at else None,
                } for b in payroll_batches
            ]
        }

    def check_import_errors(self) -> Dict[str, Any]:
        """Verifica erros nas importações"""

        # Erros Santander
        santander_errors = self.db.query(ImportRow).filter(
            ImportRow.status.like("error%")
        ).count()

        # Erros Payroll - items sem client_id ou contract_id
        payroll_errors = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.client_id.is_(None),
            PayrollImportItem.contract_id.is_(None)
        ).count()

        # Últimos erros para análise
        recent_santander_errors = self.db.query(ImportRow).filter(
            ImportRow.status.like("error%")
        ).order_by(ImportRow.id.desc()).limit(10).all()

        recent_payroll_errors = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.client_id.is_(None),
            PayrollImportItem.contract_id.is_(None),
            PayrollImportItem.raw_line.like("ERRO%")
        ).order_by(PayrollImportItem.id.desc()).limit(10).all()

        return {
            "santander_error_count": santander_errors,
            "payroll_error_count": payroll_errors,
            "recent_santander_errors": [
                {"id": e.id, "status": e.status, "raw": e.raw}
                for e in recent_santander_errors
            ],
            "recent_payroll_errors": [
                {"id": e.id, "raw_line": e.raw_line}
                for e in recent_payroll_errors
            ]
        }

    def check_pipeline_population(self) -> Dict[str, Any]:
        """Verifica população da esteira após importações"""

        # Casos disponíveis na esteira
        disponivel_count = self.db.query(Case).filter(
            Case.status == "disponivel"
        ).count()

        # Casos criados recentemente (últimos 7 dias)
        recent_date = datetime.utcnow() - timedelta(days=7)
        recent_cases = self.db.query(Case).filter(
            Case.last_update_at >= recent_date
        ).count()

        # Status distribution
        status_distribution = self.db.query(
            Case.status, func.count(Case.id)
        ).group_by(Case.status).all()

        # Casos sem client_id (problema grave)
        orphan_cases = self.db.query(Case).filter(
            Case.client_id.is_(None)
        ).count()

        return {
            "available_cases": disponivel_count,
            "recent_cases_7_days": recent_cases,
            "orphan_cases": orphan_cases,
            "status_distribution": dict(status_distribution)
        }

    def check_missing_data(self) -> Dict[str, Any]:
        """Identifica dados faltantes em campos críticos"""

        # Clientes sem nome
        clients_no_name = self.db.query(Client).filter(
            Client.name.is_(None) | (Client.name == "")
        ).count()

        # Clientes sem CPF válido
        clients_invalid_cpf = self.db.query(Client).filter(
            func.length(Client.cpf) != 11
        ).count()

        # Casos sem metadados de importação
        cases_no_metadata = self.db.query(Case).filter(
            Case.entidade.is_(None),
            Case.import_batch_id.is_(None)
        ).count()

        # Contratos com valores zerados
        contracts_zero_value = self.db.query(PayrollContract).filter(
            PayrollContract.valor_parcela == 0
        ).count()

        # Amostra de clientes com dados faltantes
        sample_missing_data = self.db.query(Client).filter(
            (Client.name.is_(None)) | (Client.name == "") |
            (func.length(Client.cpf) != 11) |
            (Client.matricula.is_(None)) | (Client.matricula == "")
        ).limit(10).all()

        return {
            "clients_no_name": clients_no_name,
            "clients_invalid_cpf": clients_invalid_cpf,
            "cases_no_metadata": cases_no_metadata,
            "contracts_zero_value": contracts_zero_value,
            "sample_problematic_clients": [
                {
                    "id": c.id,
                    "name": c.name,
                    "cpf": c.cpf,
                    "matricula": c.matricula,
                    "issues": self._identify_client_issues(c)
                }
                for c in sample_missing_data
            ]
        }

    def _identify_client_issues(self, client: Client) -> List[str]:
        """Identifica problemas específicos de um cliente"""
        issues = []
        if not client.name or client.name.strip() == "":
            issues.append("missing_name")
        if not client.cpf or len(client.cpf) != 11:
            issues.append("invalid_cpf")
        if not client.matricula or client.matricula.strip() == "":
            issues.append("missing_matricula")
        return issues

    def analyze_file_vs_db_discrepancies(self, batch_id: int = None) -> Dict[str, Any]:
        """Analisa discrepâncias entre arquivos e registros no banco"""

        if batch_id:
            # Análise específica de um batch
            batch = self.db.get(ImportBatch, batch_id)
            if not batch:
                return {"error": f"Batch {batch_id} not found"}

            # Contar registros processados
            processed_rows = self.db.query(ImportRow).filter(
                ImportRow.import_id == batch_id
            ).count()

            return {
                "batch_id": batch_id,
                "filename": batch.filename,
                "counters": batch.counters or {},
                "processed_rows": processed_rows,
                "created_at": batch.created_at.isoformat()
            }
        else:
            # Análise geral dos últimos batches
            recent_batches = self.db.query(ImportBatch).order_by(
                ImportBatch.created_at.desc()
            ).limit(5).all()

            batch_analysis = []
            for batch in recent_batches:
                processed_rows = self.db.query(ImportRow).filter(
                    ImportRow.import_id == batch.id
                ).count()

                batch_analysis.append({
                    "batch_id": batch.id,
                    "filename": batch.filename,
                    "counters": batch.counters or {},
                    "processed_rows": processed_rows,
                    "created_at": batch.created_at.isoformat()
                })

            return {
                "recent_batches": batch_analysis
            }

    def generate_report(self) -> Dict[str, Any]:
        """Gera relatório completo de diagnóstico"""

        print("🔍 Analisando importações recentes...")
        recent_imports = self.analyze_recent_imports()

        print("❌ Verificando erros de importação...")
        import_errors = self.check_import_errors()

        print("🔄 Verificando população da esteira...")
        pipeline_population = self.check_pipeline_population()

        print("🗂️  Identificando dados faltantes...")
        missing_data = self.check_missing_data()

        print("📊 Analisando discrepâncias arquivo vs banco...")
        discrepancies = self.analyze_file_vs_db_discrepancies()

        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "summary": self._generate_summary(
                recent_imports, import_errors, pipeline_population, missing_data
            ),
            "recent_imports": recent_imports,
            "import_errors": import_errors,
            "pipeline_population": pipeline_population,
            "missing_data": missing_data,
            "file_discrepancies": discrepancies
        }

        return report

    def _generate_summary(self, recent_imports, import_errors, pipeline_population, missing_data) -> Dict[str, Any]:
        """Gera resumo executivo do diagnóstico"""

        total_errors = import_errors["santander_error_count"] + import_errors["payroll_error_count"]
        critical_issues = []

        if import_errors["santander_error_count"] > 0:
            critical_issues.append(f"{import_errors['santander_error_count']} erros Santander")

        if import_errors["payroll_error_count"] > 0:
            critical_issues.append(f"{import_errors['payroll_error_count']} erros Payroll")

        if pipeline_population["orphan_cases"] > 0:
            critical_issues.append(f"{pipeline_population['orphan_cases']} casos órfãos")

        if missing_data["clients_no_name"] > 0:
            critical_issues.append(f"{missing_data['clients_no_name']} clientes sem nome")

        if missing_data["clients_invalid_cpf"] > 0:
            critical_issues.append(f"{missing_data['clients_invalid_cpf']} CPFs inválidos")

        return {
            "total_imports_7_days": recent_imports["santander_imports"] + recent_imports["payroll_imports"],
            "total_errors": total_errors,
            "available_cases": pipeline_population["available_cases"],
            "critical_issues": critical_issues,
            "health_status": "CRITICAL" if len(critical_issues) > 0 else "OK"
        }


def main():
    print("🚀 Iniciando diagnóstico de importação e esteira...")
    print("=" * 60)

    with ImportDiagnostics() as diagnostics:
        report = diagnostics.generate_report()

        # Salvar relatório
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"import_diagnostics_{timestamp}.json"
        filepath = os.path.join(os.path.dirname(__file__), filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        # Exibir resumo
        print("\n📋 RESUMO EXECUTIVO")
        print("=" * 40)
        summary = report["summary"]
        print(f"Status: {summary['health_status']}")
        print(f"Importações (7 dias): {summary['total_imports_7_days']}")
        print(f"Total de erros: {summary['total_errors']}")
        print(f"Casos disponíveis: {summary['available_cases']}")

        if summary["critical_issues"]:
            print(f"\n🚨 PROBLEMAS CRÍTICOS:")
            for issue in summary["critical_issues"]:
                print(f"  • {issue}")
        else:
            print("\n✅ Nenhum problema crítico encontrado")

        print(f"\n📄 Relatório completo salvo em: {filename}")
        print("\n" + "=" * 60)


if __name__ == "__main__":
    main()