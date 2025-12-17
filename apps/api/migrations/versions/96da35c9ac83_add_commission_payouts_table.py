"""add_commission_payouts_table

Revision ID: 96da35c9ac83
Revises: 94fc2b0d4bc9
Create Date: 2025-10-16 17:10:14.806175

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96da35c9ac83'
down_revision: Union[str, None] = '94fc2b0d4bc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela commission_payouts
    op.create_table(
        'commission_payouts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('beneficiary_user_id', sa.Integer(), nullable=False),
        sa.Column('consultoria_liquida', sa.Numeric(14, 2), nullable=False),
        sa.Column('commission_percentage', sa.Numeric(5, 2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('expense_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['beneficiary_user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['expense_id'], ['finance_expenses.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('contract_id')
    )

    # Criar índices
    op.create_index('ix_commission_beneficiary', 'commission_payouts', ['beneficiary_user_id'], unique=False)
    op.create_index('ix_commission_date', 'commission_payouts', ['created_at'], unique=False)


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_commission_date', table_name='commission_payouts')
    op.drop_index('ix_commission_beneficiary', table_name='commission_payouts')

    # Remover tabela
    op.drop_table('commission_payouts')
