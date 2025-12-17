"""create_sla_executions_table

Revision ID: 8a3b4c5d6e7f
Revises: 792d3dd3313c
Create Date: 2025-10-27 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8a3b4c5d6e7f'
down_revision: Union[str, None] = '792d3dd3313c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela sla_executions
    op.create_table(
        'sla_executions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('executed_at', sa.DateTime(), nullable=False),
        sa.Column('execution_type', sa.String(20), nullable=False),
        sa.Column('cases_expired_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('cases_released', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('executed_by_user_id', sa.Integer(), nullable=True),
        sa.Column('duration_seconds', sa.Numeric(10, 2), nullable=True),
        sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['executed_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Criar índices
    op.create_index('ix_sla_executions_executed_at', 'sla_executions', ['executed_at'], unique=False)
    op.create_index('ix_sla_executions_execution_type', 'sla_executions', ['execution_type'], unique=False)
    op.create_index('ix_sla_executions_user_id', 'sla_executions', ['executed_by_user_id'], unique=False)


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_sla_executions_user_id', table_name='sla_executions')
    op.drop_index('ix_sla_executions_execution_type', table_name='sla_executions')
    op.drop_index('ix_sla_executions_executed_at', table_name='sla_executions')

    # Remover tabela
    op.drop_table('sla_executions')
