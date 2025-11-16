"""add_external_client_incomes

Revision ID: 20251014_external_incomes
Revises: 20251008_comments
Create Date: 2025-10-14 00:00:00.000000

Migração APENAS ADITIVA - cria tabela external_client_incomes para receitas de clientes externos.
Não remove nem altera tabelas existentes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = '20251014_external_incomes'
down_revision: Union[str, None] = '20251008_comments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Cria tabela external_client_incomes para receitas de clientes externos.
    Guard rails: verifica existência antes de criar.
    """
    # Guard: verificar se tabela já existe
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Verificar se tabela external_client_incomes já existe
    if 'external_client_incomes' in inspector.get_table_names():
        print("⚠️ Tabela 'external_client_incomes' já existe. Pulando criação.")
        return

    # Criar tabela external_client_incomes
    op.create_table(
        'external_client_incomes',
        sa.Column('id', sa.Integer(), nullable=False),

        # Dados básicos
        sa.Column('date', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('cpf_cliente', sa.String(length=11), nullable=False),
        sa.Column('nome_cliente', sa.String(length=180), nullable=True),

        # Simulação multi-banco
        sa.Column('banks_json', JSON, nullable=False, server_default='[]'),
        sa.Column('prazo', sa.Integer(), nullable=False),
        sa.Column('coeficiente', sa.Text(), nullable=False),
        sa.Column('seguro', sa.Numeric(14, 2), nullable=False),
        sa.Column('percentual_consultoria', sa.Numeric(5, 2), nullable=False),

        # Totais calculados
        sa.Column('valor_parcela_total', sa.Numeric(14, 2), nullable=False),
        sa.Column('saldo_total', sa.Numeric(14, 2), nullable=False),
        sa.Column('liberado_total', sa.Numeric(14, 2), nullable=False),
        sa.Column('total_financiado', sa.Numeric(14, 2), nullable=False),
        sa.Column('valor_liquido', sa.Numeric(14, 2), nullable=False),
        sa.Column('custo_consultoria', sa.Numeric(14, 2), nullable=False),
        sa.Column('custo_consultoria_liquido', sa.Numeric(14, 2), nullable=False),
        sa.Column('liberado_cliente', sa.Numeric(14, 2), nullable=False),

        # Atribuição
        sa.Column('owner_user_id', sa.Integer(), nullable=False),

        # Anexos
        sa.Column('attachment_path', sa.String(length=500), nullable=True),
        sa.Column('attachment_filename', sa.String(length=255), nullable=True),
        sa.Column('attachment_size', sa.Integer(), nullable=True),
        sa.Column('attachment_mime', sa.String(length=100), nullable=True),

        # Auditoria
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),

        # Foreign Keys
        sa.ForeignKeyConstraint(['owner_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),

        # Primary Key
        sa.PrimaryKeyConstraint('id')
    )

    # Criar índices
    op.create_index(
        'ix_external_income_owner',
        'external_client_incomes',
        ['owner_user_id'],
        unique=False
    )

    op.create_index(
        'ix_external_income_date',
        'external_client_incomes',
        ['date'],
        unique=False
    )

    op.create_index(
        'ix_external_income_created_by',
        'external_client_incomes',
        ['created_by'],
        unique=False
    )

    print("✅ Tabela 'external_client_incomes' criada com sucesso!")


def downgrade() -> None:
    """
    Remove tabela external_client_incomes e índices.
    ATENÇÃO: Não será usado em produção, mas mantido para testes locais.
    """
    # Remover índices
    op.drop_index('ix_external_income_created_by', table_name='external_client_incomes')
    op.drop_index('ix_external_income_date', table_name='external_client_incomes')
    op.drop_index('ix_external_income_owner', table_name='external_client_incomes')

    # Remover tabela
    op.drop_table('external_client_incomes')

    print("🗑️ Tabela 'external_client_incomes' removida (downgrade).")
