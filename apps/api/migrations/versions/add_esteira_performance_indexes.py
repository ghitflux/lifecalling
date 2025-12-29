"""add esteira performance indexes

Revision ID: esteira_perf_001
Revises:
Create Date: 2025-01-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'esteira_perf_001'
down_revision = None  # Ajustar com a última migration se necessário
branch_labels = None
depends_on = None


def upgrade():
    """
    Adiciona índices para otimizar performance da Esteira de Atendimentos.

    Índices adicionados:
    - idx_case_status: Acelera filtros por status
    - idx_case_source: Acelera filtros por origem (SIAPE/INET)
    - idx_case_created_at: Acelera ordenações por data
    - idx_case_assigned_user_id: Acelera filtros de atribuição
    - idx_payroll_line_cargo: Acelera filtros por cargo
    - idx_payroll_line_cpf: Acelera JOINs com Client
    - idx_payroll_line_entity_name: Acelera filtros por banco
    - idx_siape_line_cpf: Acelera JOINs com Client
    - idx_siape_line_banco_emprestimo: Acelera filtros por banco SIAPE
    """
    # Índices para a tabela case
    op.create_index(
        'idx_case_status',
        'case',
        ['status'],
        unique=False
    )

    op.create_index(
        'idx_case_source',
        'case',
        ['source'],
        unique=False
    )

    op.create_index(
        'idx_case_created_at',
        'case',
        ['created_at'],
        unique=False
    )

    op.create_index(
        'idx_case_assigned_user_id',
        'case',
        ['assigned_user_id'],
        unique=False
    )

    # Índices para a tabela payroll_line
    op.create_index(
        'idx_payroll_line_cargo',
        'payroll_line',
        ['cargo'],
        unique=False
    )

    op.create_index(
        'idx_payroll_line_cpf',
        'payroll_line',
        ['cpf'],
        unique=False
    )

    op.create_index(
        'idx_payroll_line_entity_name',
        'payroll_line',
        ['entity_name'],
        unique=False
    )

    # Índices para a tabela siape_line
    op.create_index(
        'idx_siape_line_cpf',
        'siape_line',
        ['cpf'],
        unique=False
    )

    op.create_index(
        'idx_siape_line_banco_emprestimo',
        'siape_line',
        ['banco_emprestimo'],
        unique=False
    )

    # Índice composto para queries que filtram por status + source
    op.create_index(
        'idx_case_status_source',
        'case',
        ['status', 'source'],
        unique=False
    )

    # Índice composto para queries que filtram por CPF + cargo (usado em filtros combinados)
    op.create_index(
        'idx_payroll_line_cpf_cargo',
        'payroll_line',
        ['cpf', 'cargo'],
        unique=False
    )


def downgrade():
    """Remove os índices criados."""
    # Remover índices compostos
    op.drop_index('idx_payroll_line_cpf_cargo', table_name='payroll_line')
    op.drop_index('idx_case_status_source', table_name='case')

    # Remover índices de siape_line
    op.drop_index('idx_siape_line_banco_emprestimo', table_name='siape_line')
    op.drop_index('idx_siape_line_cpf', table_name='siape_line')

    # Remover índices de payroll_line
    op.drop_index('idx_payroll_line_entity_name', table_name='payroll_line')
    op.drop_index('idx_payroll_line_cpf', table_name='payroll_line')
    op.drop_index('idx_payroll_line_cargo', table_name='payroll_line')

    # Remover índices de case
    op.drop_index('idx_case_assigned_user_id', table_name='case')
    op.drop_index('idx_case_created_at', table_name='case')
    op.drop_index('idx_case_source', table_name='case')
    op.drop_index('idx_case_status', table_name='case')
