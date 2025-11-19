"""update_simulations_multi_banks

Revision ID: 981d805c8617
Revises: 20250926_import_keys_and_meta
Create Date: 2025-09-28 20:07:04.037936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '981d805c8617'
down_revision: Union[str, None] = '20250926_import_keys_and_meta'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Adicionar novos campos para simulação multi-bancos
    op.add_column('simulations', sa.Column('banks_json', sa.JSON(), nullable=True))
    op.add_column('simulations', sa.Column('prazo', sa.Integer(), nullable=True))
    op.add_column('simulations', sa.Column('coeficiente', sa.Text(), nullable=True))
    op.add_column('simulations', sa.Column('seguro', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('percentual_consultoria', sa.Numeric(5,2), nullable=True))

    # Campos calculados/totais
    op.add_column('simulations', sa.Column('valor_parcela_total', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('saldo_total', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('liberado_total', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('total_financiado', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('valor_liquido', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('custo_consultoria', sa.Numeric(14,2), nullable=True))
    op.add_column('simulations', sa.Column('liberado_cliente', sa.Numeric(14,2), nullable=True))

    # Adicionar campo last_simulation_id em cases se não existir
    op.add_column('cases', sa.Column('last_simulation_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_cases_last_simulation', 'cases', 'simulations', ['last_simulation_id'], ['id'])


def downgrade() -> None:
    # Remover foreign key primeiro
    op.drop_constraint('fk_cases_last_simulation', 'cases', type_='foreignkey')
    op.drop_column('cases', 'last_simulation_id')

    # Remover colunas da tabela simulations
    op.drop_column('simulations', 'liberado_cliente')
    op.drop_column('simulations', 'custo_consultoria')
    op.drop_column('simulations', 'valor_liquido')
    op.drop_column('simulations', 'total_financiado')
    op.drop_column('simulations', 'liberado_total')
    op.drop_column('simulations', 'saldo_total')
    op.drop_column('simulations', 'valor_parcela_total')
    op.drop_column('simulations', 'percentual_consultoria')
    op.drop_column('simulations', 'seguro')
    op.drop_column('simulations', 'coeficiente')
    op.drop_column('simulations', 'prazo')
    op.drop_column('simulations', 'banks_json')
