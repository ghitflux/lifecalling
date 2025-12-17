"""merge_heads_before_siape

Revision ID: 6e3bdf1d902e
Revises: 20251107_add_origin_finance, 58ff80113c98
Create Date: 2025-12-04 05:55:59.778944

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e3bdf1d902e'
down_revision: Union[str, None] = ('20251107_add_origin_finance', '58ff80113c98')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
