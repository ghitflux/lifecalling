"""add_attachments_to_finance_transactions

Revision ID: 602387fc6b56
Revises: e358a362ec69
Create Date: 2025-10-04 09:43:00.446563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '602387fc6b56'
down_revision: Union[str, None] = 'e358a362ec69'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de anexo à tabela finance_expenses
    op.add_column('finance_expenses', sa.Column('attachment_path', sa.String(500), nullable=True))
    op.add_column('finance_expenses', sa.Column('attachment_filename', sa.String(255), nullable=True))
    op.add_column('finance_expenses', sa.Column('attachment_size', sa.Integer, nullable=True))
    op.add_column('finance_expenses', sa.Column('attachment_mime', sa.String(100), nullable=True))

    # Adicionar campos de anexo à tabela finance_incomes
    op.add_column('finance_incomes', sa.Column('attachment_path', sa.String(500), nullable=True))
    op.add_column('finance_incomes', sa.Column('attachment_filename', sa.String(255), nullable=True))
    op.add_column('finance_incomes', sa.Column('attachment_size', sa.Integer, nullable=True))
    op.add_column('finance_incomes', sa.Column('attachment_mime', sa.String(100), nullable=True))


def downgrade() -> None:
    # Remover campos de anexo da tabela finance_expenses
    op.drop_column('finance_expenses', 'attachment_mime')
    op.drop_column('finance_expenses', 'attachment_size')
    op.drop_column('finance_expenses', 'attachment_filename')
    op.drop_column('finance_expenses', 'attachment_path')

    # Remover campos de anexo da tabela finance_incomes
    op.drop_column('finance_incomes', 'attachment_mime')
    op.drop_column('finance_incomes', 'attachment_size')
    op.drop_column('finance_incomes', 'attachment_filename')
    op.drop_column('finance_incomes', 'attachment_path')
