"""add orgao_pagamento_nome to payroll_lines

Revision ID: e8f9g0h1i2j3
Revises: d6e7f8g9h0i1
Create Date: 2025-09-29 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e8f9g0h1i2j3'
down_revision = 'd6e7f8g9h0i1'
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona campo orgao_pagamento_nome para armazenar nome completo do órgão pagador.
    """
    op.add_column('payroll_lines', sa.Column('orgao_pagamento_nome', sa.String(255), nullable=True))


def downgrade():
    """
    Remove campo orgao_pagamento_nome.
    """
    op.drop_column('payroll_lines', 'orgao_pagamento_nome')