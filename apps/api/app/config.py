from pydantic import BaseModel
import os

class Settings(BaseModel):
    db_uri: str = f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}"
    jwt_secret: str = os.getenv("JWT_SECRET","dev")
    jwt_iss: str = os.getenv("JWT_ISS","lifecalling")
    access_ttl: int = int(os.getenv("JWT_ACCESS_TTL_SECONDS", "900"))
    refresh_ttl: int = int(os.getenv("JWT_REFRESH_TTL_SECONDS", "2592000"))
    upload_dir: str = os.getenv("UPLOAD_DIR","/var/app/uploads")

settings = Settings()
