"""Fix Case model - add missing fields

Revision ID: fix_case_model_fields
Revises:
Create Date: 2025-01-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fix_case_model_fields'
down_revision = None
depends_on = None


def upgrade():
    # Add missing fields to cases table
    op.add_column('cases', sa.Column('entidade', sa.String(length=200), nullable=True))
    op.add_column('cases', sa.Column('referencia_competencia', sa.String(length=20), nullable=True))
    op.add_column('cases', sa.Column('importado_em', sa.DateTime(), nullable=True))
    op.add_column('cases', sa.Column('import_batch_id', sa.Integer(), nullable=True))
    op.add_column('cases', sa.Column('previous_contracts_snapshot', sa.JSON(), nullable=True))

    # Create foreign key constraint for import_batch_id
    try:
        op.create_foreign_key('fk_cases_import_batch', 'cases', 'imports', ['import_batch_id'], ['id'])
    except Exception:
        # FK might already exist, ignore
        pass


def downgrade():
    # Drop foreign key constraint
    try:
        op.drop_constraint('fk_cases_import_batch', 'cases', type_='foreignkey')
    except Exception:
        # Constraint might not exist, ignore
        pass

    # Drop columns
    op.drop_column('cases', 'previous_contracts_snapshot')
    op.drop_column('cases', 'import_batch_id')
    op.drop_column('cases', 'importado_em')
    op.drop_column('cases', 'referencia_competencia')
    op.drop_column('cases', 'entidade')