"""Add import metadata fields to cases table

Revision ID: 20250926_import_keys_and_meta
Revises: banking_fields_001
Create Date: 2025-01-14 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '20250926_import_keys_and_meta'
down_revision = 'banking_fields_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add import metadata fields to cases table
    op.add_column("cases", sa.Column("entidade", sa.String(120), nullable=True))
    op.add_column("cases", sa.Column("referencia_competencia", sa.String(7), nullable=True))
    op.add_column("cases", sa.Column("importado_em", sa.Date(), nullable=True))
    op.add_column("cases", sa.Column("import_batch_id", sa.Integer(), nullable=True))
    op.add_column("cases", sa.Column("previous_contracts_snapshot", JSONB, nullable=True))

    # Create FK to import_batches (imports table)
    try:
        op.create_foreign_key(
            "fk_cases_import_batch", "cases", "imports", ["import_batch_id"], ["id"], ondelete="SET NULL"
        )
    except Exception:
        # If imports table doesn't exist yet, skip FK creation
        pass


def downgrade():
    # Remove FK constraint first
    try:
        op.drop_constraint("fk_cases_import_batch", "cases", type_="foreignkey")
    except Exception:
        pass

    # Remove columns
    op.drop_column("cases", "previous_contracts_snapshot")
    op.drop_column("cases", "import_batch_id")
    op.drop_column("cases", "importado_em")
    op.drop_column("cases", "referencia_competencia")
    op.drop_column("cases", "entidade")