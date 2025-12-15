from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator
from .config import settings

engine = create_engine(
    settings.db_uri, 
    pool_pre_ping=True,
    connect_args={"client_encoding": "utf8"}
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
Base = declarative_base()


def sync_users_id_sequence() -> None:
    """
    Mantém o `users_id_seq` alinhado com `MAX(users.id)`.

    Isso evita erro intermitente de cadastro quando o banco foi restaurado/seedado
    e a sequence ficou atrás do maior `id` existente (violação de PK `users_pkey`).
    """
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "SELECT setval(pg_get_serial_sequence('users','id'), "
                    "COALESCE((SELECT MAX(id) FROM users), 1));"
                )
            )
    except Exception as exc:
        # Não deve derrubar a API; apenas loga para diagnóstico.
        print(f"[WARN] Could not sync users_id_seq: {exc}")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
