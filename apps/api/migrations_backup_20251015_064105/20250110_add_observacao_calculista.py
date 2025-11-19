"""add_observacao_calculista_to_simulations

Revision ID: 20250110_add_obs
Revises: add_indexes_rankings
Create Date: 2025-01-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20250110_add_obs'
down_revision = 'add_indexes_rankings'
branch_labels = None
depends_on = None


def upgrade():
    # Adicionar coluna observacao_calculista na tabela simulations
    op.add_column('simulations', sa.Column('observacao_calculista', sa.Text(), nullable=True))


def downgrade():
    # Remover coluna observacao_calculista
    op.drop_column('simulations', 'observacao_calculista')
