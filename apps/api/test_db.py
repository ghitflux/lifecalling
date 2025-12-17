from app.config import settings
print(f"DB URI: {settings.db_uri}")

# Test connection
import psycopg2
try:
    conn = psycopg2.connect(settings.db_uri.replace("postgresql+psycopg2://", "postgresql://"))
    print("✓ Conexão PostgreSQL OK!")
    conn.close()
except Exception as e:
    print(f"✗ Erro de conexão: {e}")
