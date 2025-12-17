"""Allow payroll lines without batch reference for manual clients.

Revision ID: 3f0f5f1d3a4b
Revises: 20251008_comments
Create Date: 2025-02-09 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f0f5f1d3a4b"
down_revision: Union[str, None] = "20251008_comments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Permite cadastro manual de clientes sem vínculo com batches de importação."""
    op.alter_column(
        "payroll_lines",
        "batch_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    """Reverte alteração tornando batch_id obrigatório novamente."""
    op.alter_column(
        "payroll_lines",
        "batch_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

