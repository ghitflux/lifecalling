"""merge_heads

Revision ID: 93004d254ff9
Revises: add_mobile_performance_indexes, f1a2b3c4d5e6
Create Date: 2025-11-26 19:15:34.573267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93004d254ff9'
down_revision: Union[str, None] = ('add_mobile_performance_indexes', 'f1a2b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
