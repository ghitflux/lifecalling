# (unused import removed)
from sqlalchemy import engine_from_config, pool
from alembic import context

# >>> ADIÇÕES (importam sua config e os modelos)
from app.config import settings
from app.db import Base
import app.models  # noqa: F401 – ensures all tables are registered

config = context.config

# >>> ESTA LINHA É CRÍTICA: injeta a URL real do Postgres
config.set_main_option("sqlalchemy.url", settings.db_uri)

# Alembic usará o metadata do seu Base (autogenerate)
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    context.configure(
        url=settings.db_uri,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
