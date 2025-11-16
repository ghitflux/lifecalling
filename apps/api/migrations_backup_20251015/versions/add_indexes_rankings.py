"""add_indexes_rankings

Revision ID: add_indexes_rankings
Revises: add_campaigns_table
Create Date: 2025-10-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_indexes_rankings'
down_revision = 'add_campaigns_table'
branch_labels = None
depends_on = None

def upgrade():
    # Criar índices para otimizar queries de ranking
    op.create_index('idx_contracts_status', 'contracts', ['status'])
    op.create_index('idx_contracts_agent_user_id', 'contracts', ['agent_user_id'])
    op.create_index('idx_contracts_signed_at', 'contracts', ['signed_at'])
    op.create_index('idx_contracts_disbursed_at', 'contracts', ['disbursed_at'])
    op.create_index('idx_contracts_created_at', 'contracts', ['created_at'])
    op.create_index('idx_contracts_case_id', 'contracts', ['case_id'])
    op.create_index('idx_cases_assigned_user_id', 'cases', ['assigned_user_id'])
    
    # Índice composto para melhor performance em queries de ranking
    op.create_index('idx_contracts_status_dates', 'contracts', ['status', 'signed_at', 'disbursed_at'])

def downgrade():
    op.drop_index('idx_contracts_status_dates', table_name='contracts')
    op.drop_index('idx_cases_assigned_user_id', table_name='cases')
    op.drop_index('idx_contracts_case_id', table_name='contracts')
    op.drop_index('idx_contracts_created_at', table_name='contracts')
    op.drop_index('idx_contracts_disbursed_at', table_name='contracts')
    op.drop_index('idx_contracts_signed_at', table_name='contracts')
    op.drop_index('idx_contracts_agent_user_id', table_name='contracts')
    op.drop_index('idx_contracts_status', table_name='contracts')
