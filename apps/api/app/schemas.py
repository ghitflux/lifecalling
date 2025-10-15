from pydantic import BaseModel, Field, field_validator  # pyright: ignore[reportMissingImports]
from typing import List, Optional
from datetime import datetime


class BankSimulation(BaseModel):
    """Dados de um banco na simulação multi-banco"""
    banco: str = Field(..., min_length=1, max_length=100)
    matricula: str = Field(..., min_length=1, max_length=40)
    saldo_devedor: float = Field(..., gt=0)
    valor_parcela: float = Field(..., gt=0)
    liberado: float = Field(..., gt=0)


# ExternalClientIncome schemas removed as requested