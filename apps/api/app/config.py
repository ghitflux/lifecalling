from pydantic import BaseModel
import os
from pathlib import Path

# Carregar variáveis de ambiente do .env.local (se existir) ou .env
try:
    from dotenv import load_dotenv
    # Prioridade: .env.local > .env
    env_local = Path(__file__).parent.parent / ".env.local"
    env_file = Path(__file__).parent.parent / ".env"

    if env_local.exists():
        load_dotenv(env_local)
        print(f"✅ Loaded environment from: {env_local}")
    elif env_file.exists():
        load_dotenv(env_file)
        print(f"✅ Loaded environment from: {env_file}")
except ImportError:
    print("⚠️ python-dotenv not installed, using system environment variables")

class Settings(BaseModel):
    db_uri: str = None
    jwt_secret: str = os.getenv("JWT_SECRET","dev")
    jwt_iss: str = os.getenv("JWT_ISS","lifecalling")
    access_ttl: int = int(os.getenv("JWT_ACCESS_TTL_SECONDS", "3600"))
    refresh_ttl: int = int(os.getenv("JWT_REFRESH_TTL_SECONDS", "2592000"))
    upload_dir: str = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        # Configura URI do banco - SEMPRE PostgreSQL
        if os.getenv("DATABASE_URL"):
            self.db_uri = os.getenv("DATABASE_URL")
        else:
            # PostgreSQL com valores padrão do .env
            postgres_user = os.getenv('POSTGRES_USER', 'lifecalling')
            postgres_password = os.getenv('POSTGRES_PASSWORD', 'lifecalling')
            postgres_host = os.getenv('POSTGRES_HOST', 'localhost')
            postgres_port = os.getenv('POSTGRES_PORT', '5432')
            postgres_db = os.getenv('POSTGRES_DB', 'lifecalling')

            self.db_uri = f"postgresql+psycopg2://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

settings = Settings()
