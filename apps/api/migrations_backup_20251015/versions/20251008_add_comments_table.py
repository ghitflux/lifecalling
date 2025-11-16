"""add_comments_table

Revision ID: 20251008_comments
Revises: 20250110_add_obs
Create Date: 2025-10-08 23:15:00.000000

Migração APENAS ADITIVA - cria tabela comments para sistema unificado de comentários.
Não remove nem altera tabelas existentes.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '20251008_comments'
down_revision: Union[str, None] = '20250110_add_obs'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Cria tabela comments e enum comment_channel.
    Guard rails: verifica existência antes de criar.
    """
    # Guard: verificar se tabela já existe
    conn = op.get_bind()
    inspector = sa.inspect(conn)

    # Verificar se tabela comments já existe
    if 'comments' in inspector.get_table_names():
        print("⚠️ Tabela 'comments' já existe. Pulando criação.")
        return

    # 1. Criar extensão pgcrypto para gen_random_uuid() (se ainda não existe)
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

    # 2. Criar Enum comment_channel
    op.execute("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'comment_channel') THEN
                CREATE TYPE comment_channel AS ENUM ('ATENDIMENTO', 'SIMULACAO', 'FECHAMENTO', 'CLIENTE');
            END IF;
        END $$;
    """)

    # 3. Criar tabela comments
    op.create_table(
        'comments',
        sa.Column('id', UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('case_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=True),
        sa.Column('author_name', sa.String(length=120), nullable=False),
        sa.Column('role', sa.String(length=30), nullable=False),
        sa.Column('channel', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('parent_id', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('edited_at', sa.DateTime(), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Criar índice composto para queries eficientes
    op.create_index(
        'ix_comments_case_channel_created',
        'comments',
        ['case_id', 'channel', 'created_at'],
        unique=False
    )

    # 5. Criar índice simples para case_id (queries sem channel)
    op.create_index(
        op.f('ix_comments_case_id'),
        'comments',
        ['case_id'],
        unique=False
    )

    print("✅ Tabela 'comments' criada com sucesso!")


def downgrade() -> None:
    """
    Remove tabela comments, índices e enum.
    ATENÇÃO: Não será usado em produção, mas mantido para testes locais.
    """
    # Remover índices
    op.drop_index('ix_comments_case_id', table_name='comments')
    op.drop_index('ix_comments_case_channel_created', table_name='comments')

    # Remover tabela
    op.drop_table('comments')

    # Remover enum (apenas se não estiver em uso)
    op.execute("DROP TYPE IF EXISTS comment_channel CASCADE;")

    print("🗑️ Tabela 'comments' removida (downgrade).")
