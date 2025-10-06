"""add case assignment fields

Revision ID: add_case_assignment_fields
Revises: 981d805c8617
Create Date: 2025-01-15 10:00:00.000000

Adiciona campos para sistema de lock temporal de 72 horas:
- assigned_at: Timestamp de quando foi atribuído
- assignment_expires_at: Timestamp de quando expira a atribuição
- assignment_history: JSON com histórico de atribuições e mudanças

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_case_assignment_fields'
down_revision = '981d805c8617'
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona novos campos ao modelo Case para sistema de lock temporal.
    """
    # Adicionar campos de lock temporal à tabela cases
    op.add_column('cases', sa.Column('assigned_at', sa.DateTime(), nullable=True))
    op.add_column('cases', sa.Column('assignment_expires_at', sa.DateTime(), nullable=True))
    op.add_column('cases', sa.Column('assignment_history', sa.JSON(), nullable=True))

    # Criar índices para otimizar queries do scheduler
    op.create_index('ix_cases_assignment_expires_at', 'cases', ['assignment_expires_at'], unique=False)
    op.create_index('ix_cases_assigned_at', 'cases', ['assigned_at'], unique=False)
    op.create_index('ix_cases_assigned_user_expires', 'cases', ['assigned_user_id', 'assignment_expires_at'], unique=False)


def downgrade():
    """
    Remove os campos adicionados caso seja necessário fazer rollback.
    """
    # Remover índices
    op.drop_index('ix_cases_assigned_user_expires', table_name='cases')
    op.drop_index('ix_cases_assigned_at', table_name='cases')
    op.drop_index('ix_cases_assignment_expires_at', table_name='cases')

    # Remover colunas
    op.drop_column('cases', 'assignment_history')
    op.drop_column('cases', 'assignment_expires_at')
    op.drop_column('cases', 'assigned_at')