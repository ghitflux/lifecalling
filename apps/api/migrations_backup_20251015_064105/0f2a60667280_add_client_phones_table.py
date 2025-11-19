"""add_client_phones_table

Revision ID: 0f2a60667280
Revises: 989ceffa65c2
Create Date: 2025-10-01 13:22:25.970304

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f2a60667280'
down_revision: Union[str, None] = '989ceffa65c2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela client_phones
    op.create_table(
        'client_phones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('client_id', 'phone', name='uq_client_phone')
    )


def downgrade() -> None:
    # Remover tabela client_phones
    op.drop_table('client_phones')
