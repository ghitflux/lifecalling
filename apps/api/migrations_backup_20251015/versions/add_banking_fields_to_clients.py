"""Add banking fields to clients table

Revision ID: banking_fields_001
Revises: d5f039ccc928
Create Date: 2025-01-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'banking_fields_001'
down_revision = 'd5f039ccc928'
branch_labels = None
depends_on = None


def upgrade():
    # Add banking fields to clients table
    op.add_column('clients', sa.Column('banco', sa.String(length=100), nullable=True))
    op.add_column('clients', sa.Column('agencia', sa.String(length=10), nullable=True))
    op.add_column('clients', sa.Column('conta', sa.String(length=20), nullable=True))
    op.add_column('clients', sa.Column('chave_pix', sa.String(length=100), nullable=True))
    op.add_column('clients', sa.Column('tipo_chave_pix', sa.String(length=20), nullable=True))


def downgrade():
    # Remove banking fields from clients table
    op.drop_column('clients', 'tipo_chave_pix')
    op.drop_column('clients', 'chave_pix')
    op.drop_column('clients', 'conta')
    op.drop_column('clients', 'agencia')
    op.drop_column('clients', 'banco')