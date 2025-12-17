"""add created_at to cases

Revision ID: d6e7f8g9h0i1
Revises: c1f2e3d4a5b6
Create Date: 2025-09-29 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd6e7f8g9h0i1'
down_revision = 'c1f2e3d4a5b6'
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona campo created_at para rastrear data de criação do caso.
    """
    # Adicionar coluna com valor padrão para registros existentes
    op.add_column('cases', sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()))

    # Remover server_default após adicionar (para novos registros usarem o default do modelo)
    op.alter_column('cases', 'created_at', server_default=None)


def downgrade():
    """
    Remove campo created_at.
    """
    op.drop_column('cases', 'created_at')