"""add_file_path_to_import_batches

Revision ID: baae7d6e83df
Revises: e8f9g0h1i2j3
Create Date: 2025-09-30 01:04:55.752374

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'baae7d6e83df'
down_revision: Union[str, None] = 'e8f9g0h1i2j3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna file_path à tabela import_batches
    op.add_column('import_batches', sa.Column('file_path', sa.String(length=512), nullable=True))


def downgrade() -> None:
    # Remover coluna file_path
    op.drop_column('import_batches', 'file_path')
