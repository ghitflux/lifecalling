"""add_income_type_field

Revision ID: k3l4m5n6o7p8
Revises: e7f8g9h0i1j2
Create Date: 2025-10-01 18:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'k3l4m5n6o7p8'
down_revision: Union[str, None] = 'e7f8g9h0i1j2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna income_type
    op.add_column('finance_incomes', sa.Column('income_type', sa.String(100), nullable=True))

    # Renomear description para income_name
    op.alter_column('finance_incomes', 'description', new_column_name='income_name')

    # Migrar dados existentes: definir tipo padrão
    op.execute("""
        UPDATE finance_incomes
        SET income_type = 'Receita Manual'
        WHERE income_type IS NULL
    """)

    # Tornar income_type obrigatório
    op.alter_column('finance_incomes', 'income_type', nullable=False)


def downgrade() -> None:
    # Renomear income_name de volta para description
    op.alter_column('finance_incomes', 'income_name', new_column_name='description')

    # Remover coluna income_type
    op.drop_column('finance_incomes', 'income_type')
