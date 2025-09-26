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
    observacoes = Column(Text)
    __table_args__ = (UniqueConstraint('cpf','matricula', name='uq_client_cpf_matricula'),)

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(40), default="novo")
    last_update_at = Column(DateTime, default=datetime.utcnow)
    client = relationship("Client")
    assigned_user = relationship("User")

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

class ImportBatch(Base):
    __tablename__ = "imports"
    id = Column(Integer, primary_key=True)
    filename = Column(String(255))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    counters = Column(JSON, default={})

class ImportRow(Base):
    __tablename__ = "import_rows"
    id = Column(Integer, primary_key=True)
    import_id = Column(Integer, ForeignKey("imports.id"))
    cpf = Column(String(11))
    matricula = Column(String(40))
    parsed = Column(JSON, default={})
    raw = Column(Text)
    status = Column(String(30))  # created|updated|error

class Simulation(Base):
    __tablename__ = "simulations"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending|approved|rejected
    manual_input = Column(JSON, default={})
    results = Column(JSON, default={})
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

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
