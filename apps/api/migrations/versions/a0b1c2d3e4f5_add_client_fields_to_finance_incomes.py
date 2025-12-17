"""add_client_fields_to_finance_incomes

Revision ID: a0b1c2d3e4f5
Revises: 96da35c9ac83
Create Date: 2025-10-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a0b1c2d3e4f5'
down_revision: Union[str, None] = '96da35c9ac83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de cliente em finance_incomes
    op.add_column('finance_incomes', sa.Column('client_cpf', sa.String(14), nullable=True, comment='CPF do cliente (para receitas manuais)'))
    op.add_column('finance_incomes', sa.Column('client_name', sa.String(255), nullable=True, comment='Nome do cliente (para receitas manuais)'))


def downgrade() -> None:
    # Remover campos de cliente
    op.drop_column('finance_incomes', 'client_name')
    op.drop_column('finance_incomes', 'client_cpf')
