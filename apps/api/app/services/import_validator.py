"""
Serviço de validação pós-importação para verificar população da esteira
e integridade dos dados importados.
"""

import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..models import (
    ImportBatch, ImportRow, PayrollImportBatch, PayrollImportItem,
    Client, Case, PayrollClient, PayrollContract, now_brt
)

logger = logging.getLogger(__name__)


class ImportValidationResult:
    """Resultado da validação de importação"""
    def __init__(self):
        self.is_valid = True
        self.warnings: List[str] = []
        self.errors: List[str] = []
        self.statistics: Dict[str, Any] = {}

    def add_warning(self, message: str):
        self.warnings.append(message)
        logger.warning(f"Import validation warning: {message}")

    def add_error(self, message: str):
        self.errors.append(message)
        self.is_valid = False
        logger.error(f"Import validation error: {message}")

    def add_statistic(self, key: str, value: Any):
        self.statistics[key] = value

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "warnings": self.warnings,
            "errors": self.errors,
            "statistics": self.statistics
        }


class ImportValidator:
    """Validador de importações"""

    def __init__(self, db: Session):
        self.db = db

    def validate_santander_import(self, batch_id: int) -> ImportValidationResult:
        """Valida importação Santander específica"""
        result = ImportValidationResult()

        batch = self.db.get(ImportBatch, batch_id)
        if not batch:
            result.add_error(f"Batch {batch_id} não encontrado")
            return result

        # Estatísticas básicas
        total_rows = self.db.query(ImportRow).filter(ImportRow.import_id == batch_id).count()
        success_rows = self.db.query(ImportRow).filter(
            ImportRow.import_id == batch_id,
            ~ImportRow.status.like("error%")
        ).count()
        error_rows = total_rows - success_rows

        result.add_statistic("batch_id", batch_id)
        result.add_statistic("filename", batch.filename)
        result.add_statistic("total_rows", total_rows)
        result.add_statistic("success_rows", success_rows)
        result.add_statistic("error_rows", error_rows)

        if total_rows == 0:
            result.add_error("Nenhuma linha processada")
            return result

        # Verificar taxa de erro
        error_rate = (error_rows / total_rows) * 100 if total_rows > 0 else 0
        result.add_statistic("error_rate", error_rate)

        if error_rate > 10:
            result.add_error(f"Taxa de erro muito alta: {error_rate:.1f}%")
        elif error_rate > 5:
            result.add_warning(f"Taxa de erro elevada: {error_rate:.1f}%")

        # Verificar se casos foram criados na esteira
        cases_created = self.db.query(Case).filter(
            Case.import_batch_id == batch_id
        ).count()

        result.add_statistic("cases_created", cases_created)

        if cases_created == 0:
            result.add_error("Nenhum caso criado na esteira")
        elif cases_created < success_rows * 0.9:  # Esperamos pelo menos 90% de conversão
            result.add_warning(f"Poucos casos criados: {cases_created} de {success_rows} linhas válidas")

        # Verificar casos disponíveis
        available_cases = self.db.query(Case).filter(
            Case.import_batch_id == batch_id,
            Case.status == "disponivel"
        ).count()

        result.add_statistic("available_cases", available_cases)

        if available_cases == 0:
            result.add_warning("Nenhum caso com status 'disponivel' criado")

        # Verificar integridade dos clientes
        self._validate_client_integrity(result, batch_id)

        return result

    def validate_payroll_import(self, batch_id: int) -> ImportValidationResult:
        """Valida importação Payroll específica"""
        result = ImportValidationResult()

        batch = self.db.get(PayrollImportBatch, batch_id)
        if not batch:
            result.add_error(f"Payroll batch {batch_id} não encontrado")
            return result

        # Estatísticas básicas
        total_items = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.batch_id == batch_id
        ).count()

        success_items = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.batch_id == batch_id,
            PayrollImportItem.client_id.isnot(None)
        ).count()

        error_items = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.batch_id == batch_id,
            PayrollImportItem.client_id.is_(None)
        ).count()

        result.add_statistic("batch_id", batch_id)
        result.add_statistic("file_name", batch.file_name)
        result.add_statistic("entidade", batch.entidade_name)
        result.add_statistic("total_items", total_items)
        result.add_statistic("success_items", success_items)
        result.add_statistic("error_items", error_items)

        if total_items == 0:
            result.add_error("Nenhum item processado")
            return result

        # Verificar taxa de erro
        error_rate = (error_items / total_items) * 100 if total_items > 0 else 0
        result.add_statistic("error_rate", error_rate)

        if error_rate > 10:
            result.add_error(f"Taxa de erro muito alta: {error_rate:.1f}%")
        elif error_rate > 5:
            result.add_warning(f"Taxa de erro elevada: {error_rate:.1f}%")

        # Verificar clientes criados no sistema payroll
        payroll_clients = self.db.query(PayrollClient).join(
            PayrollImportItem, PayrollImportItem.client_id == PayrollClient.id
        ).filter(PayrollImportItem.batch_id == batch_id).count()

        result.add_statistic("payroll_clients", payroll_clients)

        # Verificar casos criados no sistema principal
        main_cases = self.db.query(Case).join(
            Client, Client.id == Case.client_id
        ).join(
            PayrollClient,
            (Client.cpf == PayrollClient.cpf) & (Client.matricula == PayrollClient.matricula)
        ).join(
            PayrollImportItem, PayrollImportItem.client_id == PayrollClient.id
        ).filter(PayrollImportItem.batch_id == batch_id).count()

        result.add_statistic("main_cases_created", main_cases)

        if main_cases == 0:
            result.add_warning("Nenhum caso criado no sistema principal")

        # Verificar contratos
        contracts_created = self.db.query(PayrollContract).join(
            PayrollImportItem, PayrollImportItem.contract_id == PayrollContract.id
        ).filter(PayrollImportItem.batch_id == batch_id).count()

        result.add_statistic("contracts_created", contracts_created)

        if contracts_created == 0:
            result.add_warning("Nenhum contrato criado")

        return result

    def _validate_client_integrity(self, result: ImportValidationResult, batch_id: int):
        """Valida integridade dos clientes criados"""

        # Buscar clientes relacionados a este batch
        clients_in_cases = self.db.query(Client).join(
            Case, Client.id == Case.client_id
        ).filter(Case.import_batch_id == batch_id).all()

        clients_with_issues = 0

        for client in clients_in_cases:
            issues = []

            if not client.name or client.name.strip() == "":
                issues.append("nome_vazio")

            if not client.cpf or len(client.cpf) != 11:
                issues.append("cpf_invalido")

            if not client.matricula or client.matricula.strip() == "":
                issues.append("matricula_vazia")

            if issues:
                clients_with_issues += 1
                logger.debug(f"Cliente {client.id} com problemas: {issues}")

        result.add_statistic("clients_with_issues", clients_with_issues)
        result.add_statistic("total_clients_checked", len(clients_in_cases))

        if clients_with_issues > 0:
            issue_rate = (clients_with_issues / len(clients_in_cases)) * 100
            if issue_rate > 5:
                result.add_warning(f"{clients_with_issues} clientes com dados incompletos ({issue_rate:.1f}%)")

    def validate_pipeline_population(self, hours_back: int = 24) -> ImportValidationResult:
        """Valida população da esteira nas últimas X horas"""
        result = ImportValidationResult()

        since_time = now_brt() - timedelta(hours=hours_back)

        # Importações recentes
        recent_imports = self.db.query(ImportBatch).filter(
            ImportBatch.created_at >= since_time
        ).count()

        recent_payroll = self.db.query(PayrollImportBatch).filter(
            PayrollImportBatch.processed_at >= since_time
        ).count()

        result.add_statistic("recent_imports_santander", recent_imports)
        result.add_statistic("recent_imports_payroll", recent_payroll)
        result.add_statistic("hours_analyzed", hours_back)

        # Casos criados recentemente
        recent_cases = self.db.query(Case).filter(
            Case.last_update_at >= since_time
        ).count()

        # Casos disponíveis
        available_cases = self.db.query(Case).filter(
            Case.status == "disponivel"
        ).count()

        result.add_statistic("recent_cases", recent_cases)
        result.add_statistic("available_cases", available_cases)

        if recent_imports + recent_payroll > 0 and recent_cases == 0:
            result.add_error("Importações recentes não geraram casos na esteira")

        if available_cases == 0:
            result.add_warning("Nenhum caso disponível na esteira")

        # Verificar distribuição de status
        status_dist = self.db.query(
            Case.status, func.count(Case.id)
        ).group_by(Case.status).all()

        result.add_statistic("status_distribution", dict(status_dist))

        return result

    def get_import_health_summary(self) -> Dict[str, Any]:
        """Retorna resumo da saúde das importações"""

        # Últimas 24 horas
        since_24h = now_brt() - timedelta(hours=24)

        # Importações
        imports_24h = self.db.query(ImportBatch).filter(
            ImportBatch.created_at >= since_24h
        ).count()

        payroll_24h = self.db.query(PayrollImportBatch).filter(
            PayrollImportBatch.processed_at >= since_24h
        ).count()

        # Erros
        import_errors_24h = self.db.query(ImportRow).filter(
            ImportRow.status.like("error%")
        ).join(ImportBatch, ImportRow.import_id == ImportBatch.id).filter(
            ImportBatch.created_at >= since_24h
        ).count()

        payroll_errors_24h = self.db.query(PayrollImportItem).filter(
            PayrollImportItem.client_id.is_(None),
            PayrollImportItem.raw_line.like("ERRO%")
        ).join(PayrollImportBatch, PayrollImportItem.batch_id == PayrollImportBatch.id).filter(
            PayrollImportBatch.processed_at >= since_24h
        ).count()

        # Pipeline
        available_cases = self.db.query(Case).filter(Case.status == "disponivel").count()
        total_cases = self.db.query(Case).count()

        # Calcular saúde geral
        total_imports = imports_24h + payroll_24h
        total_errors = import_errors_24h + payroll_errors_24h

        if total_imports == 0:
            health_status = "NO_ACTIVITY"
        elif total_errors == 0:
            health_status = "HEALTHY"
        elif total_errors / total_imports < 0.05:  # Menos de 5% erro
            health_status = "GOOD"
        elif total_errors / total_imports < 0.1:   # Menos de 10% erro
            health_status = "WARNING"
        else:
            health_status = "CRITICAL"

        return {
            "health_status": health_status,
            "last_24_hours": {
                "imports_santander": imports_24h,
                "imports_payroll": payroll_24h,
                "errors_santander": import_errors_24h,
                "errors_payroll": payroll_errors_24h,
                "total_imports": total_imports,
                "total_errors": total_errors,
                "error_rate": (total_errors / total_imports * 100) if total_imports > 0 else 0
            },
            "pipeline": {
                "available_cases": available_cases,
                "total_cases": total_cases,
                "availability_rate": (available_cases / total_cases * 100) if total_cases > 0 else 0
            },
            "timestamp": now_brt().isoformat()
        }