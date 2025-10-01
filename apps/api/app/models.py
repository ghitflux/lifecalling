from sqlalchemy import Numeric
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, UniqueConstraint, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(180), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)  # admin|supervisor|financeiro|calculista|atendente
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(40), default="novo")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_update_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)

class Attachment(Base):
    __tablename__ = "attachments"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    path = Column(String(255), nullable=False)
    mime = Column(String(100))
    size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    status = Column(String(20), default="draft")  # draft|approved|rejected
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Dados de entrada multi-bancos
    banks_json = Column(JSON, default=[])  # Lista de até 4 bancos
    prazo = Column(Integer)  # Prazo em meses
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    case = relationship("Case")
    attachments = relationship("ContractAttachment", back_populates="contract", cascade="all, delete-orphan")

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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    event = Column(String(64), nullable=False)  # ex: case.updated
    payload = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class FinanceExpense(Base):
    __tablename__ = "finance_expenses"
    id = Column(Integer, primary_key=True)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)  # 2024, 2025, etc
    description = Column(Text, nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    # Constraint: apenas uma despesa por mês/ano
    __table_args__ = (UniqueConstraint('month', 'year', name='uq_finance_expense_month_year'),)

    # Relacionamentos
    creator = relationship("User")

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)

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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
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
    created_at = Column(DateTime, default=datetime.utcnow)
    line_number = Column(Integer, nullable=True)

    # Relacionamentos
    batch = relationship("ImportBatch", back_populates="lines")

    __table_args__ = (
        UniqueConstraint('cpf', 'matricula', 'financiamento_code', 'ref_month', 'ref_year',
                        name='uix_payroll_unique_ref'),
    )
