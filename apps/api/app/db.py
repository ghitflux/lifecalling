from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator
from .config import settings

engine = create_engine(
    settings.db_uri,
    pool_pre_ping=True,
    pool_size=10,              # Máximo 10 conexões permanentes
    max_overflow=20,           # Até 20 conexões adicionais temporárias (total: 30)
    pool_timeout=30,           # Aguardar no máximo 30s por uma conexão disponível
    pool_recycle=3600,         # Reciclar conexões após 1 hora
    echo_pool=False,           # Desabilitar log detalhado de pool (performance)
    connect_args={
        "client_encoding": "utf8",
        "connect_timeout": 10,  # Timeout de conexão: 10s
        "options": "-c statement_timeout=30000"  # Timeout de query: 30s
    }
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
