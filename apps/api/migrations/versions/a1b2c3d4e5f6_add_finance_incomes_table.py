"""add_finance_incomes_table

Revision ID: a1b2c3d4e5f6
Revises: 989ceffa65c2
Create Date: 2025-10-01 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '989ceffa65c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela finance_incomes
    op.create_table(
        'finance_incomes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Criar índice em date para consultas rápidas
    op.create_index('ix_finance_incomes_date', 'finance_incomes', ['date'])


def downgrade() -> None:
    # Remover índice
    op.drop_index('ix_finance_incomes_date', table_name='finance_incomes')

    # Remover tabela finance_incomes
    op.drop_table('finance_incomes')
