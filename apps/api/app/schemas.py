from pydantic import BaseModel, Field, field_validator  # pyright: ignore[reportMissingImports]
from typing import List, Optional
from datetime import datetime


class BankSimulation(BaseModel):
    """Dados de um banco na simula��o multi-banco"""
    banco: str = Field(..., min_length=1, max_length=100)
    matricula: str = Field(..., min_length=1, max_length=40)
    saldo_devedor: float = Field(..., gt=0)
    valor_parcela: float = Field(..., gt=0)
    liberado: float = Field(..., gt=0)


class ExternalClientIncomeCreate(BaseModel):
    """Schema para cria��o de receita de cliente externo"""
    # Dados b�sicos
    date: datetime
    cpf_cliente: str = Field(..., min_length=11, max_length=11)
    nome_cliente: Optional[str] = Field(None, max_length=180)

    # Simula��o multi-banco
    banks_json: List[BankSimulation] = Field(..., min_length=1, max_length=6)
    prazo: int = Field(..., gt=0)
    coeficiente: str = Field(..., min_length=1)
    seguro: float = Field(..., ge=0)
    percentual_consultoria: float = Field(..., gt=0, le=100)

    # Atribui��o
    owner_user_id: int = Field(..., gt=0)

    @field_validator('cpf_cliente')
    @classmethod
    def validate_cpf(cls, v: str) -> str:
        """Validar que CPF cont�m apenas d�gitos"""
        if not v.isdigit():
            raise ValueError('CPF deve conter apenas d�gitos')
        if len(v) != 11:
            raise ValueError('CPF deve ter 11 d�gitos')
        return v

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        """Validar que data n�o � futura"""
        if v > datetime.now():
            raise ValueError('Data n�o pode ser futura')
        return v


class ExternalClientIncomeUpdate(BaseModel):
    """Schema para atualiza��o de receita de cliente externo"""
    # Dados b�sicos
    date: Optional[datetime] = None
    cpf_cliente: Optional[str] = Field(None, min_length=11, max_length=11)
    nome_cliente: Optional[str] = Field(None, max_length=180)

    # Simula��o multi-banco
    banks_json: Optional[List[BankSimulation]] = Field(None, min_length=1, max_length=6)
    prazo: Optional[int] = Field(None, gt=0)
    coeficiente: Optional[str] = Field(None, min_length=1)
    seguro: Optional[float] = Field(None, ge=0)
    percentual_consultoria: Optional[float] = Field(None, gt=0, le=100)

    # Atribui��o
    owner_user_id: Optional[int] = Field(None, gt=0)

    @field_validator('cpf_cliente')
    @classmethod
    def validate_cpf(cls, v: Optional[str]) -> Optional[str]:
        """Validar que CPF cont�m apenas d�gitos"""
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError('CPF deve conter apenas d�gitos')
        if len(v) != 11:
            raise ValueError('CPF deve ter 11 d�gitos')
        return v

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: Optional[datetime]) -> Optional[datetime]:
        """Validar que data n�o � futura"""
        if v is None:
            return v
        if v > datetime.now():
            raise ValueError('Data n�o pode ser futura')
        return v


class ExternalClientIncomeResponse(BaseModel):
    """Schema de resposta para receita de cliente externo"""
    id: int

    # Dados b�sicos
    date: datetime
    cpf_cliente: str
    nome_cliente: Optional[str]

    # Simula��o multi-banco
    banks_json: List[dict]
    prazo: int
    coeficiente: str
    seguro: float
    percentual_consultoria: float

    # Totais calculados
    valor_parcela_total: float
    saldo_total: float
    liberado_total: float
    total_financiado: float
    valor_liquido: float
    custo_consultoria: float
    custo_consultoria_liquido: float
    liberado_cliente: float

    # Atribui��o
    owner_user_id: int
    owner_name: Optional[str] = None  # Ser� preenchido pelo endpoint

    # Anexos
    attachment_path: Optional[str]
    attachment_filename: Optional[str]
    attachment_size: Optional[int]
    attachment_mime: Optional[str]
    has_attachment: bool = False

    # Auditoria
    created_by: int
    created_by_name: Optional[str] = None  # Ser� preenchido pelo endpoint
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
