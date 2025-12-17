"""create_client_addresses_table

Revision ID: b1c2d3e4f5g6
Revises: 8a3b4c5d6e7f
Create Date: 2025-11-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5g6'
down_revision: Union[str, None] = '8a3b4c5d6e7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Criar tabela client_addresses
    op.create_table(
        'client_addresses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('cep', sa.String(8), nullable=True),
        sa.Column('logradouro', sa.String(200), nullable=True),
        sa.Column('numero', sa.String(20), nullable=True),
        sa.Column('complemento', sa.String(100), nullable=True),
        sa.Column('bairro', sa.String(100), nullable=True),
        sa.Column('cidade', sa.String(100), nullable=True),
        sa.Column('estado', sa.String(2), nullable=True),
        sa.Column('is_primary', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Criar índices
    op.create_index('ix_client_addresses_client_id', 'client_addresses', ['client_id'], unique=False)
    op.create_index('ix_client_addresses_cidade', 'client_addresses', ['cidade'], unique=False)
    op.create_index('ix_client_addresses_estado', 'client_addresses', ['estado'], unique=False)


def downgrade() -> None:
    # Remover índices
    op.drop_index('ix_client_addresses_estado', table_name='client_addresses')
    op.drop_index('ix_client_addresses_cidade', table_name='client_addresses')
    op.drop_index('ix_client_addresses_client_id', table_name='client_addresses')

    # Remover tabela
    op.drop_table('client_addresses')
