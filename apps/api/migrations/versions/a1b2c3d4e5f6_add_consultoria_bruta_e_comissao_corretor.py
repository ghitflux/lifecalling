"""add_consultoria_bruta_e_comissao_corretor

Revision ID: a1b2c3d4e5f6
Revises: 96da35c9ac83
Create Date: 2025-10-24 02:41:49.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'a0b1c2d3e4f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de consultoria bruta e imposto
    op.add_column('contracts', sa.Column('consultoria_bruta', sa.Numeric(14, 2), nullable=True))
    op.add_column('contracts', sa.Column('imposto_percentual', sa.Numeric(5, 2), server_default='14.00', nullable=True))
    op.add_column('contracts', sa.Column('imposto_valor', sa.Numeric(14, 2), nullable=True))

    # Adicionar campos de comissão de corretor
    op.add_column('contracts', sa.Column('tem_corretor', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('contracts', sa.Column('corretor_nome', sa.String(255), nullable=True))
    op.add_column('contracts', sa.Column('corretor_comissao_valor', sa.Numeric(14, 2), nullable=True))
    op.add_column('contracts', sa.Column('corretor_expense_id', sa.Integer(), nullable=True))

    # Criar FK para finance_expenses
    op.create_foreign_key(
        'fk_contract_corretor_expense',
        'contracts',
        'finance_expenses',
        ['corretor_expense_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remover FK
    op.drop_constraint('fk_contract_corretor_expense', 'contracts', type_='foreignkey')

    # Remover campos de comissão
    op.drop_column('contracts', 'corretor_expense_id')
    op.drop_column('contracts', 'corretor_comissao_valor')
    op.drop_column('contracts', 'corretor_nome')
    op.drop_column('contracts', 'tem_corretor')

    # Remover campos de consultoria bruta
    op.drop_column('contracts', 'imposto_valor')
    op.drop_column('contracts', 'imposto_percentual')
    op.drop_column('contracts', 'consultoria_bruta')
