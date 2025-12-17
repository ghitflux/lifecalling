"""add_cargo_to_clients

Revision ID: 58ff80113c98
Revises: 2358a948a557
Create Date: 2025-12-02 08:27:24.180648

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '58ff80113c98'
down_revision: Union[str, None] = '2358a948a557'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna cargo à tabela clients
    op.add_column('clients', sa.Column('cargo', sa.String(length=255), nullable=True))


def downgrade() -> None:
    # Remover coluna cargo da tabela clients
    op.drop_column('clients', 'cargo')
