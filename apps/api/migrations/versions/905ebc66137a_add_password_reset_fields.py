"""add_password_reset_fields

Revision ID: 905ebc66137a
Revises: 86c3811f0705
Create Date: 2025-10-02 15:07:25.742467

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '905ebc66137a'
down_revision: Union[str, None] = '86c3811f0705'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de reset de senha
    op.add_column('users', sa.Column('reset_token', sa.String(100), nullable=True))
    op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Remover campos de reset de senha
    op.drop_column('users', 'reset_token_expires')
    op.drop_column('users', 'reset_token')
