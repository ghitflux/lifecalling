"""add_expense_type_and_name

Revision ID: e7f8g9h0i1j2
Revises: a1b2c3d4e5f6
Create Date: 2025-10-01 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e7f8g9h0i1j2'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remover constraint único de mês/ano
    op.drop_constraint('uq_finance_expense_month_year', 'finance_expenses', type_='unique')

    # Adicionar coluna de data
    op.add_column('finance_expenses', sa.Column('date', sa.DateTime(), nullable=True))

    # Adicionar colunas de tipo e nome
    op.add_column('finance_expenses', sa.Column('expense_type', sa.String(100), nullable=True))
    op.add_column('finance_expenses', sa.Column('expense_name', sa.String(255), nullable=True))

    # Migrar dados existentes: copiar description para expense_name
    op.execute("""
        UPDATE finance_expenses
        SET expense_name = description,
            expense_type = 'Geral',
            date = make_date(year, month, 1)
        WHERE expense_name IS NULL
    """)

    # Tornar campos obrigatórios após migração
    op.alter_column('finance_expenses', 'date', nullable=False)
    op.alter_column('finance_expenses', 'expense_type', nullable=False)
    op.alter_column('finance_expenses', 'expense_name', nullable=False)

    # Criar índice em date para consultas rápidas
    op.create_index('ix_finance_expenses_date', 'finance_expenses', ['date'])

    # Manter month/year por compatibilidade, mas agora derivados de date


def downgrade() -> None:
    # Remover índice
    op.drop_index('ix_finance_expenses_date', table_name='finance_expenses')

    # Remover novas colunas
    op.drop_column('finance_expenses', 'expense_name')
    op.drop_column('finance_expenses', 'expense_type')
    op.drop_column('finance_expenses', 'date')

    # Recriar constraint único
    op.create_unique_constraint('uq_finance_expense_month_year', 'finance_expenses', ['month', 'year'])
