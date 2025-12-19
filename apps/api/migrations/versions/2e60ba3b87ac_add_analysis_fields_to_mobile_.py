"""add_analysis_fields_to_mobile_simulations

Revision ID: 2e60ba3b87ac
Revises: 36b022dae3d6
Create Date: 2025-12-08 08:36:59.898073

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2e60ba3b87ac'
down_revision: Union[str, None] = '36b022dae3d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de análise à tabela mobile_simulations
    op.add_column('mobile_simulations', sa.Column('analysis_status', sa.String(30), server_default='pending_analysis'))
    op.add_column('mobile_simulations', sa.Column('analyst_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('mobile_simulations', sa.Column('analyst_notes', sa.Text(), nullable=True))
    op.add_column('mobile_simulations', sa.Column('pending_documents', sa.JSON(), server_default='[]'))
    op.add_column('mobile_simulations', sa.Column('analyzed_at', sa.DateTime(), nullable=True))
    op.add_column('mobile_simulations', sa.Column('client_type', sa.String(20), nullable=True))
    op.add_column('mobile_simulations', sa.Column('has_active_contract', sa.Boolean(), server_default='false'))


def downgrade() -> None:
    # Remover campos de análise da tabela mobile_simulations
    op.drop_column('mobile_simulations', 'has_active_contract')
    op.drop_column('mobile_simulations', 'client_type')
    op.drop_column('mobile_simulations', 'analyzed_at')
    op.drop_column('mobile_simulations', 'pending_documents')
    op.drop_column('mobile_simulations', 'analyst_notes')
    op.drop_column('mobile_simulations', 'analyst_id')
    op.drop_column('mobile_simulations', 'analysis_status')
