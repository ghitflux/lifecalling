"""add_client_import_fields

Revision ID: ec1f10b49d5d
Revises: baae7d6e83df
Create Date: 2025-09-30 06:50:44.578697

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec1f10b49d5d'
down_revision: Union[str, None] = 'baae7d6e83df'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar campos de importação em Client
    op.add_column('clients', sa.Column('orgao_pgto_code', sa.String(length=10), nullable=True))
    op.add_column('clients', sa.Column('orgao_pgto_name', sa.String(length=120), nullable=True))
    op.add_column('clients', sa.Column('status_desconto', sa.String(length=1), nullable=True))
    op.add_column('clients', sa.Column('status_legenda', sa.String(length=120), nullable=True))
    op.add_column('clients', sa.Column('cpf_matricula', sa.String(length=60), nullable=True))

    # Criar índice para cpf_matricula
    op.create_index('ix_clients_cpf_matricula', 'clients', ['cpf_matricula'], unique=False)

    # Popular cpf_matricula para registros existentes
    op.execute("UPDATE clients SET cpf_matricula = cpf || '|' || matricula WHERE cpf_matricula IS NULL")


def downgrade() -> None:
    # Remover índice e campos adicionados
    op.drop_index('ix_clients_cpf_matricula', table_name='clients')
    op.drop_column('clients', 'cpf_matricula')
    op.drop_column('clients', 'status_legenda')
    op.drop_column('clients', 'status_desconto')
    op.drop_column('clients', 'orgao_pgto_name')
    op.drop_column('clients', 'orgao_pgto_code')
