"""add_agent_to_finance_expenses

Revision ID: 792d3dd3313c
Revises: a1b2c3d4e5f6
Create Date: 2025-10-24 10:00:58.858357

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '792d3dd3313c'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos em finance_expenses
    with op.batch_alter_table('finance_expenses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('agent_user_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('client_cpf', sa.String(length=14), nullable=True))
        batch_op.add_column(sa.Column('client_name', sa.String(length=255), nullable=True))
        batch_op.create_foreign_key(None, 'users', ['agent_user_id'], ['id'])

    # Nota: client_cpf e client_name em finance_incomes já foram criados na migração a0b1c2d3e4f5


def downgrade() -> None:
    # Remover campos de finance_expenses
    with op.batch_alter_table('finance_expenses', schema=None) as batch_op:
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('client_name')
        batch_op.drop_column('client_cpf')
        batch_op.drop_column('agent_user_id')
