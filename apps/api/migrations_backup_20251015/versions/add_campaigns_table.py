"""Add campaigns table

Revision ID: add_campaigns_table
Revises: 602387fc6b56
Create Date: 2025-01-14 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision = 'add_campaigns_table'
down_revision = '602387fc6b56'
branch_labels = None
depends_on = None


def upgrade():
    # Create campaigns table
    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(length=255), nullable=False),
        sa.Column('descricao', sa.Text(), nullable=True),
        sa.Column('data_inicio', sa.Date(), nullable=False),
        sa.Column('data_fim', sa.Date(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='proxima'),
        sa.Column('criterio_pontuacao', sa.String(length=50), nullable=False, server_default='consultoria_liquida'),
        sa.Column('premiacoes', JSON, nullable=False, server_default='[]'),
        sa.Column('meta_contratos', sa.Integer(), nullable=True),
        sa.Column('meta_consultoria', sa.Numeric(precision=14, scale=2), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create index for status queries
    op.create_index('ix_campaigns_status', 'campaigns', ['status'])
    op.create_index('ix_campaigns_dates', 'campaigns', ['data_inicio', 'data_fim'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_campaigns_dates', table_name='campaigns')
    op.drop_index('ix_campaigns_status', table_name='campaigns')
    
    # Drop table
    op.drop_table('campaigns')