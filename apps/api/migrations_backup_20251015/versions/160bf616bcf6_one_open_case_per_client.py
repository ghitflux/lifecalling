from alembic import op
import sqlalchemy as sa

# === Identificadores da migration ===
revision = "160bf616bcf6"          # <-- mantenha igual ao nome do arquivo (ou qualquer id único)
down_revision = "0f2a60667280"     # <-- última migração aplicada (add_client_phones_table)
branch_labels = None
depends_on = None


def upgrade():
    """
    Índice único parcial: garante APENAS 1 atendimento 'aberto' por cliente.
    Ajuste a lista de status se no seu projeto os nomes forem outros.
    """
    op.create_index(
        "uq_open_case_per_client",      # nome do índice
        "cases",                        # tabela (ajuste se for outro nome)
        ["client_id"],                  # colunas
        unique=True,
        postgresql_where=sa.text("status IN ('open','in_progress','pending')"),
    )


def downgrade():
    op.drop_index("uq_open_case_per_client", table_name="cases")
