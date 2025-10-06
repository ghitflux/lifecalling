# apps/api/app/services/import_helpers.py
from sqlalchemy.orm import Session
from typing import Optional, Tuple

from app.services.case_service import get_or_create_open_case
from app.services.client_service import get_or_create_client_with_enrollment
from app.models import Client, ClientEnrollment, Case

def ensure_client_case(
    db: Session,
    cpf: str,
    matricula: Optional[str] = None,
    orgao: Optional[str] = None,
    nome: Optional[str] = None,
) -> Tuple[Client, Optional[ClientEnrollment], Case]:
    """
    Retorna (client, enrollment|None, case_aberto).
    Garante: 1 case aberto por cliente (idempotente).
    """
    client, enrollment = get_or_create_client_with_enrollment(
        db, cpf=cpf, matricula=matricula, orgao=orgao, name=nome
    )
    case, _ = get_or_create_open_case(db, client_id=client.id)
    return client, enrollment, case
