"""merge external incomes with existing heads

Revision ID: df98ce091467
Revises: 20251014_external_incomes, 3f0f5f1d3a4b
Create Date: 2025-10-14 11:19:22.253562

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'df98ce091467'
down_revision: Union[str, None] = ('20251014_external_incomes', '3f0f5f1d3a4b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
