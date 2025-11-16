"""hotfix: add missing case columns for import

Revision ID: c1f2e3d4a5b6
Revises: b1787647421a
Create Date: 2025-09-29 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'c1f2e3d4a5b6'
down_revision = 'b1787647421a'
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona as colunas faltantes que deveriam ter sido criadas
    pela migration import_inetconsig_folha mas não foram aplicadas.
    """
    # Verificar e adicionar cada coluna com segurança

    # 1. source - Campo obrigatório para origem do caso
    try:
        op.add_column('cases', sa.Column('source', sa.String(32), server_default='import', nullable=False))
    except Exception as e:
        print(f"Coluna 'source' já existe ou erro: {e}")

    # 2. entity_code - Código da entidade
    try:
        op.add_column('cases', sa.Column('entity_code', sa.String(16), nullable=True))
    except Exception as e:
        print(f"Coluna 'entity_code' já existe ou erro: {e}")

    # 3. ref_month - Mês de referência
    try:
        op.add_column('cases', sa.Column('ref_month', sa.Integer, nullable=True))
    except Exception as e:
        print(f"Coluna 'ref_month' já existe ou erro: {e}")

    # 4. ref_year - Ano de referência
    try:
        op.add_column('cases', sa.Column('ref_year', sa.Integer, nullable=True))
    except Exception as e:
        print(f"Coluna 'ref_year' já existe ou erro: {e}")

    # 5. import_batch_id_new - Nova referência ao batch
    try:
        op.add_column('cases', sa.Column(
            'import_batch_id_new',
            sa.Integer,
            sa.ForeignKey('import_batches.id', ondelete='SET NULL'),
            nullable=True
        ))
    except Exception as e:
        print(f"Coluna 'import_batch_id_new' já existe ou erro: {e}")

    # 6. payroll_status_summary - Resumo dos status
    try:
        op.add_column('cases', sa.Column('payroll_status_summary', postgresql.JSON, nullable=True))
    except Exception as e:
        print(f"Coluna 'payroll_status_summary' já existe ou erro: {e}")

    # Criar índice para otimização de queries
    try:
        op.create_index('ix_cases_import_source', 'cases', ['source', 'entity_code'])
    except Exception as e:
        print(f"Índice 'ix_cases_import_source' já existe ou erro: {e}")


def downgrade():
    """
    Remove as colunas adicionadas.
    """
    # Remover índice
    try:
        op.drop_index('ix_cases_import_source', table_name='cases')
    except Exception:
        pass

    # Remover colunas
    try:
        op.drop_column('cases', 'payroll_status_summary')
    except Exception:
        pass

    try:
        op.drop_column('cases', 'import_batch_id_new')
    except Exception:
        pass

    try:
        op.drop_column('cases', 'ref_year')
    except Exception:
        pass

    try:
        op.drop_column('cases', 'ref_month')
    except Exception:
        pass

    try:
        op.drop_column('cases', 'entity_code')
    except Exception:
        pass

    try:
        op.drop_column('cases', 'source')
    except Exception:
        pass