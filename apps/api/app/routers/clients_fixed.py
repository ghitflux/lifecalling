from fastapi import APIRouter, Depends, HTTPException, Query  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import func, or_, distinct  # pyright: ignore[reportMissingImports]
from typing import List
import csv
import io
from ..db import SessionLocal
from ..rbac import require_roles
from ..models import (
    Client, Case, PayrollClient, PayrollContract, PayrollLine, ClientPhone, ClientAddress
)
from ..schemas import (
    ClientAddressCreate, ClientAddressUpdate, ClientAddressResponse,
    BulkCadastroRow, BulkCadastroImportResponse
)
from pydantic import BaseModel  # pyright: ignore[reportMissingImports]
from datetime import datetime
import re

r = APIRouter(prefix="/clients", tags=["clients"])



def normalize_bank_name(name: str) -> str:
    """Normaliza nome de banco para agrupar variações."""
    if not name:
        return name
    normalized = name.upper().strip()

    # BANCO DO BRASIL: tratar PRIMEIRO antes de remover BRASIL
    if 'BANCO DO BRASIL' in normalized:
        return 'BANCO DO BRASIL'

    # Remover sufixos societários
    normalized = normalized.replace(' S.A.', '').replace(' S/A', '').replace(' S.A', '')

    # Padronizar bancos específicos
    if 'SANTANDER' in normalized:
        return 'BANCO SANTANDER'
    elif 'SANATANDER' in normalized:
        return 'BANCO SANTANDER'
    elif 'DAYCOVAL' in normalized:
        return 'BANCO DAYCOVAL'
    elif 'DIGIO' in normalized and 'PREVIDENCIA' not in normalized:
        return 'BANCO DIGIO'
    elif 'FUTURO PREVID' in normalized:
        return 'FUTURO PREVIDÊNCIA'
    elif 'EQUATORIAL PREVID' in normalized:
        return 'EQUATORIAL PREVIDÊNCIA'
    elif 'CAIXA ECONOMICA' in normalized:
        return 'CAIXA ECONOMICA FEDERAL'
    elif 'BRADESCO' in normalized:
        return 'BANCO BRADESCO'
    elif 'PINE' in normalized:
        return 'BANCO PINE'
    elif 'INDUSTRIAL' in normalized:
        return 'BANCO INDUSTRIAL DO BRASIL'

    # Remover CARTÃO e BRASIL do final
    normalized = normalized.replace(' CARTAO', '').replace(' CARTÃO', '')
    if normalized.endswith(' BRASIL'):
        normalized = normalized[:-7]

    # Remover espaços duplos
    return ' '.join(normalized.split())

r = APIRouter(prefix="/clients", tags=["clients"])
