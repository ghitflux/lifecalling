"""Add origin to finance incomes and expenses

Revision ID: 20251107_add_origin_finance
Revises: 261c0a8e5d26_add_mobile_simulation_multibank_fields
Create Date: 2025-11-07
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251107_add_origin_finance'
down_revision = 'add_mobile_performance_indexes'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('finance_incomes', sa.Column('origin', sa.String(length=20), nullable=False, server_default='web'))
    op.add_column('finance_expenses', sa.Column('origin', sa.String(length=20), nullable=False, server_default='web'))


def downgrade():
    op.drop_column('finance_expenses', 'origin')
    op.drop_column('finance_incomes', 'origin')
