"""add_siape_models_and_client_source_tags

Revision ID: 36b022dae3d6
Revises: 6e3bdf1d902e
Create Date: 2025-12-04 05:56:08.425986

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '36b022dae3d6'
down_revision: Union[str, None] = '6e3bdf1d902e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    def refresh_inspector() -> None:
        # Inspector possui cache interno; após DDL, limpar para refletir o schema atualizado.
        insp.info_cache.clear()

    def table_exists(table_name: str) -> bool:
        return table_name in insp.get_table_names()

    def column_exists(table_name: str, column_name: str) -> bool:
        return column_name in {col["name"] for col in insp.get_columns(table_name)}

    def index_exists(table_name: str, index_name: str) -> bool:
        return index_name in {idx["name"] for idx in insp.get_indexes(table_name)}

    # Adicionar campo source_tags à tabela clients (idempotente - ambientes podem já ter a coluna)
    if not column_exists("clients", "source_tags"):
        op.add_column("clients", sa.Column("source_tags", postgresql.JSON(astext_type=sa.Text()), nullable=True))

    has_siape_batches = table_exists("siape_batches")
    has_siape_lines = table_exists("siape_lines")
    has_client_siape_info = table_exists("client_siape_info")

    # Criar tabela siape_batches (idempotente)
    if not has_siape_batches:
        op.create_table(
            "siape_batches",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("entity_code", sa.String(length=16), nullable=False),
            sa.Column("entity_name", sa.String(length=255), nullable=False),
            sa.Column("ref_month", sa.Integer(), nullable=False),
            sa.Column("ref_year", sa.Integer(), nullable=False),
            sa.Column("generated_at", sa.DateTime(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("created_by", sa.Integer(), nullable=True),
            sa.Column("filename", sa.String(length=255), nullable=True),
            sa.Column("file_path", sa.String(length=512), nullable=True),
            sa.Column("total_lines", sa.Integer(), nullable=True),
            sa.Column("processed_lines", sa.Integer(), nullable=True),
            sa.Column("error_lines", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        refresh_inspector()
        has_siape_batches = True

    # Criar tabela siape_lines (idempotente)
    created_siape_lines = False
    if not has_siape_lines:
        op.create_table(
            "siape_lines",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("batch_id", sa.Integer(), nullable=False),
            sa.Column("cpf", sa.String(length=14), nullable=False),
            sa.Column("nome", sa.String(length=255), nullable=False),
            sa.Column("matricula", sa.String(length=32), nullable=False),
            sa.Column("nascimento", sa.String(length=20), nullable=True),
            sa.Column("idade", sa.Integer(), nullable=True),
            sa.Column("banco_emprestimo", sa.String(length=255), nullable=False),
            sa.Column("prazo_restante", sa.Integer(), nullable=True),
            sa.Column("prazo_total", sa.Integer(), nullable=True),
            sa.Column("parcelas_pagas", sa.Integer(), nullable=True),
            sa.Column("valor_parcela", sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column("saldo_devedor", sa.Numeric(precision=14, scale=2), nullable=True),
            sa.Column("status_code", sa.String(length=1), nullable=False),
            sa.Column("status_description", sa.String(length=255), nullable=False),
            sa.Column("telefone", sa.String(length=20), nullable=True),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("cidade", sa.String(length=100), nullable=True),
            sa.Column("bairro", sa.String(length=100), nullable=True),
            sa.Column("cep", sa.String(length=8), nullable=True),
            sa.Column("endereco", sa.String(length=255), nullable=True),
            sa.Column("entity_code", sa.String(length=16), nullable=False),
            sa.Column("entity_name", sa.String(length=255), nullable=False),
            sa.Column("ref_month", sa.Integer(), nullable=False),
            sa.Column("ref_year", sa.Integer(), nullable=False),
            sa.Column("financiamento_code", sa.String(length=16), nullable=True),
            sa.Column("orgao_pagamento", sa.String(length=16), nullable=True),
            sa.Column("orgao_pagamento_nome", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("line_number", sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(["batch_id"], ["siape_batches.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "cpf",
                "matricula",
                "banco_emprestimo",
                "ref_month",
                "ref_year",
                name="uix_siape_unique_ref",
            ),
        )
        refresh_inspector()
        has_siape_lines = True
        created_siape_lines = True

    # Criar índices para siape_lines
    if has_siape_lines:
        ix_cpf = op.f("ix_siape_lines_cpf")
        ix_matricula = op.f("ix_siape_lines_matricula")

        # Se a tabela acabou de ser criada, os índices ainda não existem: criar direto.
        if created_siape_lines:
            op.create_index(ix_cpf, "siape_lines", ["cpf"], unique=False)
            op.create_index(ix_matricula, "siape_lines", ["matricula"], unique=False)
        else:
            if not index_exists("siape_lines", ix_cpf):
                op.create_index(ix_cpf, "siape_lines", ["cpf"], unique=False)
            if not index_exists("siape_lines", ix_matricula):
                op.create_index(ix_matricula, "siape_lines", ["matricula"], unique=False)

    # Criar tabela client_siape_info (idempotente)
    if not has_client_siape_info:
        op.create_table(
            "client_siape_info",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("client_id", sa.Integer(), nullable=False),
            sa.Column("ultimo_batch_id", sa.Integer(), nullable=True),
            sa.Column("nascimento", sa.String(length=20), nullable=True),
            sa.Column("idade", sa.Integer(), nullable=True),
            sa.Column("banco_emprestimo", sa.String(length=255), nullable=True),
            sa.Column("prazo_restante", sa.Integer(), nullable=True),
            sa.Column("prazo_total", sa.Integer(), nullable=True),
            sa.Column("parcelas_pagas", sa.Integer(), nullable=True),
            sa.Column("valor_parcela", sa.Numeric(precision=12, scale=2), nullable=True),
            sa.Column("saldo_devedor", sa.Numeric(precision=14, scale=2), nullable=True),
            sa.Column("endereco_completo", sa.String(length=500), nullable=True),
            sa.Column("cidade", sa.String(length=100), nullable=True),
            sa.Column("bairro", sa.String(length=100), nullable=True),
            sa.Column("cep", sa.String(length=8), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["ultimo_batch_id"], ["siape_batches.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        refresh_inspector()
        has_client_siape_info = True

    # Criar índice para client_siape_info
    if has_client_siape_info:
        if not index_exists("client_siape_info", "ix_client_siape_client_id"):
            op.create_index("ix_client_siape_client_id", "client_siape_info", ["client_id"], unique=False)


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_client_siape_client_id', table_name='client_siape_info')
    op.drop_index(op.f('ix_siape_lines_matricula'), table_name='siape_lines')
    op.drop_index(op.f('ix_siape_lines_cpf'), table_name='siape_lines')

    # Remover tabelas
    op.drop_table('client_siape_info')
    op.drop_table('siape_lines')
    op.drop_table('siape_batches')

    # Remover coluna source_tags de clients
    op.drop_column('clients', 'source_tags')
