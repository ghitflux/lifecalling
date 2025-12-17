"""merge finance updates

Revision ID: 86c3811f0705
Revises: 160bf616bcf6, k3l4m5n6o7p8
Create Date: 2025-10-02 04:02:38.356677

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '86c3811f0705'
down_revision: Union[str, None] = ('160bf616bcf6', 'k3l4m5n6o7p8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
