"""import inetconsig folha

Revision ID: import_inetconsig_folha
Revises: add_case_assignment_fields
Create Date: 2025-01-15 12:00:00.000000

Adiciona suporte para importação de arquivos iNETConsig:
- Tabela import_batches para lotes de importação
- Tabela payroll_lines para linhas de financiamento com status
- Novos campos em cases para rastreamento de origem
- Suporte à legenda de status do iNETConsig

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'import_inetconsig_folha'
down_revision = 'add_case_assignment_fields'
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona tabelas e campos para importação iNETConsig.
    """
    # Criar tabela de lotes de importação
    op.create_table(
        'import_batches',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('entity_code', sa.String(16), nullable=False),
        sa.Column('entity_name', sa.String(255), nullable=False),
        sa.Column('ref_month', sa.Integer, nullable=False),
        sa.Column('ref_year', sa.Integer, nullable=False),
        sa.Column('generated_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('created_by', sa.Integer, sa.ForeignKey('users.id'), nullable=True),
        sa.Column('filename', sa.String(255), nullable=True),
        sa.Column('total_lines', sa.Integer, default=0),
        sa.Column('processed_lines', sa.Integer, default=0),
        sa.Column('error_lines', sa.Integer, default=0),
    )

    # Criar tabela de linhas de folha de pagamento
    op.create_table(
        'payroll_lines',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('batch_id', sa.Integer, sa.ForeignKey('import_batches.id', ondelete='CASCADE'), nullable=False),

        # Dados básicos do funcionário
        sa.Column('cpf', sa.String(14), index=True, nullable=False),
        sa.Column('matricula', sa.String(32), index=True, nullable=False),
        sa.Column('nome', sa.String(255), nullable=False),
        sa.Column('cargo', sa.String(255), nullable=True),

        # Status iNETConsig
        sa.Column('status_code', sa.String(1), nullable=False),  # 1,2,3,4,5,6,S
        sa.Column('status_description', sa.String(255), nullable=False),

        # Dados do financiamento
        sa.Column('financiamento_code', sa.String(16), nullable=False),
        sa.Column('orgao', sa.String(16), nullable=True),
        sa.Column('lanc', sa.String(16), nullable=True),
        sa.Column('total_parcelas', sa.Integer, nullable=True),
        sa.Column('parcelas_pagas', sa.Integer, nullable=True),
        sa.Column('valor_parcela_ref', sa.Numeric(12, 2), nullable=True),
        sa.Column('orgao_pagamento', sa.String(16), nullable=True),

        # Metadados da entidade
        sa.Column('entity_code', sa.String(16), nullable=False),
        sa.Column('entity_name', sa.String(255), nullable=False),
        sa.Column('ref_month', sa.Integer, nullable=False),
        sa.Column('ref_year', sa.Integer, nullable=False),

        # Controle
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now(), nullable=False),
        sa.Column('line_number', sa.Integer, nullable=True),

        # Constraint de unicidade
        sa.UniqueConstraint(
            'cpf', 'matricula', 'financiamento_code', 'ref_month', 'ref_year',
            name='uix_payroll_unique_ref'
        )
    )

    # Adicionar novos campos à tabela cases
    op.add_column('cases', sa.Column('source', sa.String(32), server_default='import', nullable=False))
    op.add_column('cases', sa.Column('entity_code', sa.String(16), nullable=True))
    op.add_column('cases', sa.Column('ref_month', sa.Integer, nullable=True))
    op.add_column('cases', sa.Column('ref_year', sa.Integer, nullable=True))
    op.add_column('cases', sa.Column('import_batch_id', sa.Integer, sa.ForeignKey('import_batches.id', ondelete='SET NULL'), nullable=True))
    op.add_column('cases', sa.Column('payroll_status_summary', sa.JSON, nullable=True))

    # Criar índices para otimização
    op.create_index('ix_payroll_lines_cpf_matricula', 'payroll_lines', ['cpf', 'matricula'])
    op.create_index('ix_payroll_lines_status', 'payroll_lines', ['status_code'])
    op.create_index('ix_payroll_lines_ref', 'payroll_lines', ['ref_month', 'ref_year'])
    op.create_index('ix_import_batches_entity_ref', 'import_batches', ['entity_code', 'ref_month', 'ref_year'])
    op.create_index('ix_cases_import_source', 'cases', ['source', 'entity_code'])


def downgrade():
    """
    Remove tabelas e campos criados para importação iNETConsig.
    """
    # Remover índices
    op.drop_index('ix_cases_import_source', table_name='cases')
    op.drop_index('ix_import_batches_entity_ref', table_name='import_batches')
    op.drop_index('ix_payroll_lines_ref', table_name='payroll_lines')
    op.drop_index('ix_payroll_lines_status', table_name='payroll_lines')
    op.drop_index('ix_payroll_lines_cpf_matricula', table_name='payroll_lines')

    # Remover campos da tabela cases
    op.drop_column('cases', 'payroll_status_summary')
    op.drop_column('cases', 'import_batch_id')
    op.drop_column('cases', 'ref_year')
    op.drop_column('cases', 'ref_month')
    op.drop_column('cases', 'entity_code')
    op.drop_column('cases', 'source')

    # Remover tabelas
    op.drop_table('payroll_lines')
    op.drop_table('import_batches')