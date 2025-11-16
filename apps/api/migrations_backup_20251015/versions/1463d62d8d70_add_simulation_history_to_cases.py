"""add_simulation_history_to_cases

Revision ID: 1463d62d8d70
Revises: ec1f10b49d5d
Create Date: 2025-09-30 11:16:37.067563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1463d62d8d70'
down_revision: Union[str, None] = 'ec1f10b49d5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar coluna simulation_history à tabela cases
    op.add_column('cases', sa.Column('simulation_history', sa.JSON(), nullable=True))

    # Inicializar com lista vazia para casos existentes
    op.execute("UPDATE cases SET simulation_history = '[]' WHERE simulation_history IS NULL")


def downgrade() -> None:
    # Remover coluna simulation_history
    op.drop_column('cases', 'simulation_history')
