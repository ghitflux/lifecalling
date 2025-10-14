from sqlalchemy import Numeric
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, UniqueConstraint, JSON, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from .db import Base
import uuid

# Timezone Brasil (GMT-3)
BRT = timezone(timedelta(hours=-3))

def now_brt():
    """Retorna datetime atual no timezone de Brasília"""
    return datetime.now(BRT)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # admin|supervisor|financeiro|calculista|atendente
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=now_brt)

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True)
    name = Column(String(180), nullable=False)
    cpf = Column(String(11), nullable=False)         # somente dígitos
    matricula = Column(String(40), nullable=False)
    orgao = Column(String(180))
    telefone_preferencial = Column(String(20))
    numero_cliente = Column(String(20))
    observacoes = Column(Text)

    # Dados bancários
    banco = Column(String(100))                      # Nome do banco
    agencia = Column(String(10))                     # Código da agência
    conta = Column(String(20))                       # Número da conta
    chave_pix = Column(String(100))                  # Chave PIX
    tipo_chave_pix = Column(String(20))              # cpf, email, telefone, aleatoria

    # Dados de importação de folha (últimos valores conhecidos)
    orgao_pgto_code = Column(String(10), nullable=True)       # Código do órgão pagador
    orgao_pgto_name = Column(String(120), nullable=True)      # Nome do órgão pagador
    status_desconto = Column(String(1), nullable=True)        # Status do desconto (1-6, S)
    status_legenda = Column(String(120), nullable=True)       # Descrição do status
    cpf_matricula = Column(String(60), nullable=True, index=True)  # Chave normalizada: cpf|matricula

    __table_args__ = (UniqueConstraint('cpf','matricula', name='uq_client_cpf_matricula'),)

class ClientPhone(Base):
    """
    Histórico de telefones de um cliente.
    Mantém registro de todos os telefones já utilizados.
    """
    __tablename__ = "client_phones"
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    phone = Column(String(20), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=now_brt, onupdate=now_brt)

    client = relationship("Client")

    __table_args__ = (
        UniqueConstraint('client_id', 'phone', name='uq_client_phone'),
    )

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(40), default="novo")
    created_at = Column(DateTime, default=now_brt, nullable=False)
    last_update_at = Column(DateTime, default=now_brt)
    last_simulation_id = Column(Integer, ForeignKey("simulations.id"), nullable=True)

    # Campos de importação (legado)
    entidade = Column(String(200))  # Nome da entidade/banco
    referencia_competencia = Column(String(20))  # MM/YYYY
    importado_em = Column(DateTime)  # Data da geração do arquivo
    import_batch_id = Column(Integer, ForeignKey("imports.id"))  # Referência ao batch de importação (legado)
    previous_contracts_snapshot = Column(JSON)  # Snapshot de contratos anteriores

    # Novos campos para importação iNETConsig
    source = Column(String(32), default="import", nullable=False)  # Origem do caso
    entity_code = Column(String(16), nullable=True)  # Código da entidade
    ref_month = Column(Integer, nullable=True)  # Mês de referência
    ref_year = Column(Integer, nullable=True)  # Ano de referência
    import_batch_id_new = Column(Integer, ForeignKey("import_batches.id", ondelete="SET NULL"), nullable=True)  # Nova referência
    payroll_status_summary = Column(JSON, nullable=True)  # Resumo dos status da folha

    # Campos de lock temporal (sistema de 72 horas)
    assigned_at = Column(DateTime, nullable=True)  # Quando foi atribuído
    assignment_expires_at = Column(DateTime, nullable=True)  # Quando expira a atribuição
    assignment_history = Column(JSON, default=list)  # Histórico de atribuições e mudanças

    # Histórico de simulações (aprovadas e rejeitadas)
    simulation_history = Column(JSON, default=list)  # Lista de simulações passadas com totais

    client = relationship("Client")
    assigned_user = relationship("User")
    last_simulation = relationship("Simulation", foreign_keys=[last_simulation_id])
    import_batch = relationship("ImportBatch", foreign_keys=[import_batch_id_new])

class CaseEvent(Base):
    __tablename__ = "case_events"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    type = Column(String(60), nullable=False)
    payload = Column(JSON, default={})
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=now_brt)

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    path = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)  # Nome original do arquivo
    mime = Column(String(100))
    size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=now_brt)


class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    status = Column(String(20), default="draft")  # draft|approved|rejected
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Dados de entrada multi-bancos
    banks_json = Column(JSON, default=[])  # Lista de até 6 bancos
    prazo = Column(Integer)  # Prazo em meses (fixo em 96)
    coeficiente = Column(Text)  # Coeficiente como string livre
    seguro = Column(Numeric(14,2))  # Seguro obrigatório
    percentual_consultoria = Column(Numeric(5,2))  # % consultoria

    # Totais calculados
    valor_parcela_total = Column(Numeric(14,2))
    saldo_total = Column(Numeric(14,2))
    liberado_total = Column(Numeric(14,2))
    total_financiado = Column(Numeric(14,2))
    valor_liquido = Column(Numeric(14,2))
    custo_consultoria = Column(Numeric(14,2))
    custo_consultoria_liquido = Column(Numeric(14,2))
    liberado_cliente = Column(Numeric(14,2))

    # Campo de observações do calculista
    observacao_calculista = Column(Text, nullable=True)

    # Manter campos legados para compatibilidade
    manual_input = Column(JSON, default={})
    results = Column(JSON, default={})

class Contract(Base):
    __tablename__ = "contracts"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False, unique=True)
    status = Column(String(32), default="ativo")  # ativo | encerrado | inadimplente
    total_amount = Column(Numeric(14,2), default=0)
    installments = Column(Integer, default=0)
    paid_installments = Column(Integer, default=0)
    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Campos para receita e ranking
    consultoria_valor_liquido = Column(Numeric(14,2))  # 86% da consultoria
    signed_at = Column(DateTime)  # Data de assinatura/efetivação
    created_by = Column(Integer, ForeignKey("users.id"))  # Quem efetivou (financeiro)
    agent_user_id = Column(Integer, ForeignKey("users.id"))  # Atendente do caso (para ranking)

    case = relationship("Case")
    attachments = relationship("ContractAttachment", back_populates="contract", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])
    agent = relationship("User", foreign_keys=[agent_user_id])

class ContractAttachment(Base):
    __tablename__ = "contract_attachments"
    id = Column(Integer, primary_key=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)  # Referência dupla para facilitar consultas
    path = Column(String(500), nullable=False)
    filename = Column(String(255), nullable=False)
    mime = Column(String(100))
    size = Column(Integer)
    type = Column(String(50), default="comprovante")  # comprovante, documento, etc
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=now_brt)
    contract = relationship("Contract", back_populates="attachments")
    case = relationship("Case")
    uploaded_by_user = relationship("User")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False, index=True)
    installment_no = Column(Integer, nullable=False)
    amount = Column(Numeric(14,2), nullable=False)
    paid_at = Column(DateTime, nullable=False)
    receipt_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=datetime.utcnow)



class FinanceExpense(Base):
    __tablename__ = "finance_expenses"
    id = Column(Integer, primary_key=True)
    month = Column(Integer, nullable=False)  # 1-12 (mantido para compatibilidade)
    year = Column(Integer, nullable=False)  # 2024, 2025, etc (mantido para compatibilidade)
    date = Column(DateTime, nullable=False)  # Data da despesa
    expense_type = Column(String(100), nullable=False)  # Tipo da despesa (ex: "Aluguel", "Salários")
    expense_name = Column(String(255), nullable=False)  # Nome/descrição da despesa
    description = Column(Text, nullable=True)  # Campo legado (deprecated)
    amount = Column(Numeric(14, 2), nullable=False)
    attachment_path = Column(String(500), nullable=True)  # Caminho do anexo
    attachment_filename = Column(String(255), nullable=True)  # Nome original do arquivo
    attachment_size = Column(Integer, nullable=True)  # Tamanho em bytes
    attachment_mime = Column(String(100), nullable=True)  # Tipo MIME do arquivo
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Sem constraint único - permite múltiplas despesas por mês
    __table_args__ = tuple()

    # Relacionamentos
    creator = relationship("User", foreign_keys=[created_by])

class FinanceIncome(Base):
    __tablename__ = "finance_incomes"
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=now_brt, nullable=False)
    income_type = Column(String(100), nullable=False)  # Tipo da receita (ex: "Receita Manual", "Bônus")
    income_name = Column(String(255), nullable=True)  # Nome/descrição da receita
    amount = Column(Numeric(14, 2), nullable=False)
    attachment_path = Column(String(500), nullable=True)  # Caminho do anexo
    attachment_filename = Column(String(255), nullable=True)  # Nome original do arquivo
    attachment_size = Column(Integer, nullable=True)  # Tamanho em bytes
    attachment_mime = Column(String(100), nullable=True)  # Tipo MIME do arquivo
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    agent_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Atendente responsável (para receitas de contratos)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=now_brt, onupdate=now_brt)

    # Relacionamentos
    creator = relationship("User", foreign_keys=[created_by])
    agent = relationship("User", foreign_keys=[agent_user_id])

class Campaign(Base):
    """
    Campanhas de vendas e gamificação.
    Permite criar campanhas com premiações e acompanhar rankings.
    """
    __tablename__ = "campaigns"
    id = Column(Integer, primary_key=True)
    nome = Column(String(255), nullable=False)
    descricao = Column(Text, nullable=True)
    data_inicio = Column(DateTime, nullable=False)
    data_fim = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="proxima")  # proxima, ativa, encerrada
    criterio_pontuacao = Column(String(50), nullable=False, default="consultoria_liquida")
    premiacoes = Column(JSON, nullable=False, default=list)  # Lista de {posicao, premio}
    meta_contratos = Column(Integer, nullable=True)
    meta_consultoria = Column(Numeric(14,2), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=now_brt, onupdate=now_brt)

    # Relacionamentos
    creator = relationship("User", foreign_keys=[created_by])

# Payroll Import Models

class PayrollClient(Base):
    """
    Cliente normalizado para sistema de importação de folha de pagamento.
    Chave primária: (cpf, matricula)
    """
    __tablename__ = "payroll_clients"

    id = Column(Integer, primary_key=True)
    cpf = Column(String(14), nullable=False)           # somente dígitos normalizados
    matricula = Column(String(20), nullable=False)
    nome = Column(String(200), nullable=False)
    orgao = Column(String(200), nullable=True)         # último orgão visto
    created_at = Column(DateTime, default=now_brt)

    __table_args__ = (UniqueConstraint('cpf', 'matricula', name='uq_payroll_client_cpf_matricula'),)

class PayrollContract(Base):
    """
    Contrato de folha de pagamento normalizado.
    Representa um desconto específico de uma entidade em um mês/ano de referência.
    """
    __tablename__ = "payroll_contracts"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("payroll_clients.id", ondelete="CASCADE"), nullable=False)

    entidade_code = Column(String(10), nullable=False)
    entidade_name = Column(String(200), nullable=False)
    referencia_month = Column(Integer, nullable=False)   # MM
    referencia_year = Column(Integer, nullable=False)    # YYYY

    valor_parcela = Column(Numeric(12,2), nullable=False)
    total_parcelas = Column(Integer, nullable=False)
    parcelas_pagas = Column(Integer, nullable=False)

    cargo = Column(String(120), nullable=True)
    fin = Column(String(8), nullable=True)
    orgao_codigo = Column(String(12), nullable=True)
    lanc = Column(String(12), nullable=True)

    status = Column(String(30), nullable=False, default='ativo')
    created_at = Column(DateTime, default=now_brt)

    __table_args__ = (
        UniqueConstraint('client_id','entidade_code','referencia_month','referencia_year', name='uq_payroll_contract_ref'),
    )

class PayrollImportBatch(Base):
    """
    Lote de importação de folha de pagamento.
    Registra metadados de cada arquivo importado.
    """
    __tablename__ = "payroll_import_batches"

    id = Column(Integer, primary_key=True)
    file_name = Column(String(255), nullable=False)
    entidade_code = Column(String(10), nullable=False)
    entidade_name = Column(String(200), nullable=False)
    referencia_month = Column(Integer, nullable=False)
    referencia_year = Column(Integer, nullable=False)
    processed_by = Column(Integer, nullable=True)  # user_id (opcional)
    processed_at = Column(DateTime, default=datetime.utcnow)

class PayrollImportItem(Base):
    """
    Item individual de importação de folha de pagamento.
    Registra cada linha processada durante a importação.
    """
    __tablename__ = "payroll_import_items"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("payroll_import_batches.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(Integer, ForeignKey("payroll_clients.id", ondelete="SET NULL"))
    contract_id = Column(Integer, ForeignKey("payroll_contracts.id", ondelete="SET NULL"))
    raw_line = Column(Text, nullable=True)

# Modelo legado para compatibilidade de FK

class Import(Base):
    """
    Tabela legada de importações (mantida para compatibilidade de FK).
    DEPRECATED: Use ImportBatch para novas importações.
    """
    __tablename__ = "imports"

    id = Column(Integer, primary_key=True)
    filename = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=now_brt)
    counters = Column(JSON)


# Novos modelos para importação iNETConsig

class ImportBatch(Base):
    """
    Lote de importação de arquivos iNETConsig.
    Registra metadados de cada arquivo importado.
    """
    __tablename__ = "import_batches"

    id = Column(Integer, primary_key=True)
    entity_code = Column(String(16), nullable=False)
    entity_name = Column(String(255), nullable=False)
    ref_month = Column(Integer, nullable=False)
    ref_year = Column(Integer, nullable=False)
    generated_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=now_brt)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=True)
    file_path = Column(String(512), nullable=True)  # Caminho do arquivo no sistema
    total_lines = Column(Integer, default=0)
    processed_lines = Column(Integer, default=0)
    error_lines = Column(Integer, default=0)

    # Relacionamentos
    lines = relationship("PayrollLine", back_populates="batch", cascade="all, delete-orphan")
    created_by_user = relationship("User")

class PayrollLine(Base):
    """
    Linha individual de folha de pagamento iNETConsig.
    Armazena apenas campos essenciais: MATRICULA, FIN, ORGAO, LANC, TOTAL, PAGO, ORGAO PGTO, CPF
    """
    __tablename__ = "payroll_lines"

    id = Column(Integer, primary_key=True)
    batch_id = Column(Integer, ForeignKey("import_batches.id", ondelete="CASCADE"), nullable=False)

    # Dados básicos do funcionário
    cpf = Column(String(14), index=True, nullable=False)
    matricula = Column(String(32), index=True, nullable=False)
    nome = Column(String(255), nullable=True)  # Opcional para simplificar parser
    cargo = Column(String(255), nullable=True)

    # Status iNETConsig
    status_code = Column(String(1), nullable=False)  # 1,2,3,4,5,6,S
    status_description = Column(String(255), nullable=False)

    # Dados do financiamento
    financiamento_code = Column(String(16), nullable=False)
    orgao = Column(String(16), nullable=True)
    lanc = Column(String(16), nullable=True)
    total_parcelas = Column(Integer, nullable=True)
    parcelas_pagas = Column(Integer, nullable=True)
    valor_parcela_ref = Column(Numeric(12, 2), nullable=True)
    orgao_pagamento = Column(String(16), nullable=True)
    orgao_pagamento_nome = Column(String(255), nullable=True)  # Nome completo do órgão

    # Metadados da entidade
    entity_code = Column(String(16), nullable=False)
    entity_name = Column(String(255), nullable=False)
    ref_month = Column(Integer, nullable=False)
    ref_year = Column(Integer, nullable=False)

    # Controle
    created_at = Column(DateTime, default=now_brt)
    line_number = Column(Integer, nullable=True)

    # Relacionamentos
    batch = relationship("ImportBatch", back_populates="lines")

    __table_args__ = (
        UniqueConstraint('cpf', 'matricula', 'financiamento_code', 'ref_month', 'ref_year',
                        name='uix_payroll_unique_ref'),
    )

class Comment(Base):
    """
    Sistema unificado de comentários para casos.
    Substitui observações dispersas com canais específicos.
    """
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name = Column(String(120), nullable=False)
    role = Column(String(30), nullable=False)  # Role do autor no momento
    channel = Column(String(20), nullable=False)  # ATENDIMENTO|SIMULACAO|FECHAMENTO|CLIENTE
    content = Column(Text, nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=now_brt, nullable=False)
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    # Relacionamentos
    case = relationship("Case")
    author = relationship("User")
    parent = relationship("Comment", remote_side=[id])

    # Índice composto para queries eficientes
    __table_args__ = (
        Index('ix_comments_case_channel_created', 'case_id', 'channel', 'created_at'),
    )

class ExternalClientIncome(Base):
    """
    Receitas de clientes externos com simulação multi-banco.
    Permite registrar receitas oriundas de clientes externos com todos os
    detalhes da simulação, calcular consultoria líquida/impostos e atribuir
    a receita a um usuário para contabilização no ranking.
    """
    __tablename__ = "external_client_incomes"

    id = Column(Integer, primary_key=True)

    # Dados básicos
    date = Column(DateTime, nullable=False, default=now_brt)
    cpf_cliente = Column(String(11), nullable=False)  # somente dígitos
    nome_cliente = Column(String(180), nullable=True)

    # Simulação multi-banco
    banks_json = Column(JSON, default=[])  # Array de até 6 bancos
    prazo = Column(Integer, nullable=False)  # Prazo em meses
    coeficiente = Column(Text, nullable=False)  # Coeficiente como string
    seguro = Column(Numeric(14,2), nullable=False)  # Seguro obrigatório
    percentual_consultoria = Column(Numeric(5,2), nullable=False)  # % consultoria

    # Totais calculados
    valor_parcela_total = Column(Numeric(14,2), nullable=False)
    saldo_total = Column(Numeric(14,2), nullable=False)
    liberado_total = Column(Numeric(14,2), nullable=False)
    total_financiado = Column(Numeric(14,2), nullable=False)
    valor_liquido = Column(Numeric(14,2), nullable=False)
    custo_consultoria = Column(Numeric(14,2), nullable=False)
    custo_consultoria_liquido = Column(Numeric(14,2), nullable=False)
    liberado_cliente = Column(Numeric(14,2), nullable=False)

    # Atribuição
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Proprietário da receita

    # Anexos
    attachment_path = Column(String(500), nullable=True)
    attachment_filename = Column(String(255), nullable=True)
    attachment_size = Column(Integer, nullable=True)
    attachment_mime = Column(String(100), nullable=True)

    # Auditoria
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=now_brt)
    updated_at = Column(DateTime, default=now_brt, onupdate=now_brt)

    # Relacionamentos
    owner = relationship("User", foreign_keys=[owner_user_id])
    creator = relationship("User", foreign_keys=[created_by])

    # Índices
    __table_args__ = (
        Index('ix_external_income_owner', 'owner_user_id'),
        Index('ix_external_income_date', 'date'),
    )
