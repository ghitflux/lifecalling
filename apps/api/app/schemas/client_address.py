"""
Schemas para endereços de clientes e importação em massa de dados cadastrais.
"""
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime


# ========== Client Address Schemas ==========

class ClientAddressBase(BaseModel):
    """Schema base para endereço de cliente"""
    cep: Optional[str] = Field(None, max_length=8, description="CEP (apenas dígitos)")
    logradouro: Optional[str] = Field(None, max_length=200, description="Rua/Avenida")
    numero: Optional[str] = Field(None, max_length=20, description="Número")
    complemento: Optional[str] = Field(None, max_length=100, description="Complemento")
    bairro: Optional[str] = Field(None, max_length=100, description="Bairro")
    cidade: Optional[str] = Field(None, max_length=100, description="Cidade")
    estado: Optional[str] = Field(None, max_length=2, description="Estado (sigla)")
    is_primary: bool = Field(False, description="Endereço principal")

    @field_validator('estado')
    @classmethod
    def validate_estado(cls, v: Optional[str]) -> Optional[str]:
        """Valida e normaliza sigla do estado"""
        if v is not None:
            v = v.strip().upper()
            if len(v) != 2:
                raise ValueError('Estado deve ter 2 caracteres (sigla)')
        return v

    @field_validator('cep')
    @classmethod
    def validate_cep(cls, v: Optional[str]) -> Optional[str]:
        """Remove formatação do CEP"""
        if v is not None:
            v = ''.join(filter(str.isdigit, v))
            if v and len(v) != 8:
                raise ValueError('CEP deve ter 8 dígitos')
        return v


class ClientAddressCreate(ClientAddressBase):
    """Schema para criar endereço"""
    pass


class ClientAddressUpdate(ClientAddressBase):
    """Schema para atualizar endereço"""
    pass


class ClientAddressResponse(ClientAddressBase):
    """Schema de resposta com dados do endereço"""
    id: int
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Bulk Import Schemas ==========

class BulkCadastroRow(BaseModel):
    """Schema para uma linha do CSV de importação cadastral"""
    cpf: str = Field(..., description="CPF do cliente (apenas dígitos)")
    telefone: Optional[str] = Field(None, description="Telefone com DDD")
    cidade: Optional[str] = Field(None, max_length=100, description="Cidade")
    estado: Optional[str] = Field(None, max_length=2, description="Estado (sigla)")

    @field_validator('cpf')
    @classmethod
    def validate_cpf(cls, v: str) -> str:
        """Remove formatação do CPF"""
        cpf = ''.join(filter(str.isdigit, v))
        if len(cpf) != 11:
            raise ValueError('CPF deve ter 11 dígitos')
        return cpf

    @field_validator('telefone')
    @classmethod
    def validate_telefone(cls, v: Optional[str]) -> Optional[str]:
        """Remove formatação do telefone"""
        if v is not None:
            telefone = ''.join(filter(str.isdigit, v))
            if telefone and len(telefone) < 10:
                raise ValueError('Telefone deve ter no mínimo 10 dígitos (com DDD)')
            return telefone
        return v

    @field_validator('estado')
    @classmethod
    def validate_estado(cls, v: Optional[str]) -> Optional[str]:
        """Valida e normaliza sigla do estado"""
        if v is not None:
            v = v.strip().upper()
            if len(v) != 2:
                raise ValueError('Estado deve ter 2 caracteres (sigla)')
        return v


class BulkCadastroImportResponse(BaseModel):
    """Schema de resposta da importação em massa"""
    total_rows: int = Field(..., description="Total de linhas processadas")
    success_count: int = Field(..., description="Linhas processadas com sucesso")
    error_count: int = Field(..., description="Linhas com erro")
    not_found_count: int = Field(..., description="CPFs não encontrados")
    errors: List[dict] = Field(default_factory=list, description="Detalhes dos erros")
    success_details: List[dict] = Field(default_factory=list, description="Detalhes dos sucessos")
