"""add_contract_agents_table

Revision ID: f1a2b3c4d5e6
Revises: b1c2d3e4f5g6
Create Date: 2025-11-21 14:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'b1c2d3e4f5g6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Adiciona tabela contract_agents para suportar múltiplos atendentes por contrato.

    Esta tabela cria um relacionamento N:N entre contracts e users, permitindo que:
    - Um contrato tenha múltiplos atendentes
    - Cada atendente tenha um percentual específico da consultoria líquida
    - Um atendente seja marcado como principal (is_primary=True)
    """
    # Criar tabela contract_agents
    op.create_table(
        'contract_agents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('percentual', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('is_primary', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(
            ['contract_id'],
            ['contracts.id'],
            name='fk_contract_agents_contract_id',
            ondelete='CASCADE'
        ),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            name='fk_contract_agents_user_id',
            ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('id', name='pk_contract_agents')
    )

    # Criar índice único para evitar duplicatas (mesmo contrato + mesmo usuário)
    op.create_index(
        'ix_contract_agent_unique',
        'contract_agents',
        ['contract_id', 'user_id'],
        unique=True
    )

    # Criar índices para melhorar performance de queries
    op.create_index(
        'ix_contract_agents_contract_id',
        'contract_agents',
        ['contract_id'],
        unique=False
    )

    op.create_index(
        'ix_contract_agents_user_id',
        'contract_agents',
        ['user_id'],
        unique=False
    )


def downgrade() -> None:
    """
    Remove tabela contract_agents e seus índices.
    """
    # Remover índices
    op.drop_index('ix_contract_agents_user_id', table_name='contract_agents')
    op.drop_index('ix_contract_agents_contract_id', table_name='contract_agents')
    op.drop_index('ix_contract_agent_unique', table_name='contract_agents')

    # Remover tabela
    op.drop_table('contract_agents')
