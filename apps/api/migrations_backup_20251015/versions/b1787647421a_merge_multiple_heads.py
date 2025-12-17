"""merge_multiple_heads

Revision ID: b1787647421a
Revises: 26788e43ca26, fix_case_model_fields, import_inetconsig_folha
Create Date: 2025-09-29 13:24:54.780522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1787647421a'
down_revision: Union[str, None] = ('26788e43ca26', 'fix_case_model_fields', 'import_inetconsig_folha')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
