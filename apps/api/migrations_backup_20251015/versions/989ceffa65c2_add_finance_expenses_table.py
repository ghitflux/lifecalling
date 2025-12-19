"""add_finance_expenses_table

Revision ID: 989ceffa65c2
Revises: 2434c05250b1
Create Date: 2025-09-30 16:47:52.447664

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '989ceffa65c2'
down_revision: Union[str, None] = '2434c05250b1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela finance_expenses
    op.create_table(
        'finance_expenses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('amount', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('month', 'year', name='uq_finance_expense_month_year')
    )


def downgrade() -> None:
    # Remover tabela finance_expenses
    op.drop_table('finance_expenses')
