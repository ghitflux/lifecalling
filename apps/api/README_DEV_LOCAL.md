# 🚀 Executar API Localmente (Fora do Docker)

## ✅ Pré-requisitos

1. **PostgreSQL rodando no Docker**:
   ```bash
   docker compose up db -d
   ```

2. **Python 3.11+** instalado

3. **Dependências instaladas**:
   ```bash
   cd apps/api
   pip install -r requirements.txt
   ```

---

## 📝 Configuração

O arquivo `.env.local` já está configurado com as variáveis corretas para desenvolvimento local:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5433  # Porta mapeada do Docker
POSTGRES_USER=lifecalling
POSTGRES_PASSWORD=lifecalling
POSTGRES_DB=lifecalling
```

> **Nota**: O `.env.local` tem prioridade sobre o `.env` (que é usado pelo Docker Compose).

---

## 🏃 Executar a API

### Opção 1: Usando uvicorn diretamente (Recomendado)

```bash
cd apps/api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Opção 2: Definindo variáveis manualmente (Windows)

```bash
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5433
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## ✅ Verificar Conexão

Ao iniciar a API, você deve ver:

```
✅ Loaded environment from: D:\apps\trae\lifecallingv1\lifecalling\apps\api\.env.local
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Acessar Swagger Docs:
http://localhost:8000/docs

---

## 🐛 Troubleshooting

### Erro: `password authentication failed for user "lifecalling"`
- ✅ Solução: Verifique se o PostgreSQL está rodando no Docker
  ```bash
  docker compose ps
  docker compose up db -d
  ```

### Erro: `Connection refused port 5432`
- ✅ Solução: Certifique-se que `.env.local` existe e tem `POSTGRES_PORT=5433`

### Erro: `python-dotenv not installed`
- ✅ Solução: Instale as dependências
  ```bash
  pip install -r requirements.txt
  ```

---

## 📦 Migrações do Banco

Executar migrações (dentro do container Docker):
```bash
docker compose exec api alembic upgrade head
```

Verificar status:
```bash
docker compose exec api alembic current
```

---

## 🔄 Diferenças: Docker vs Local

| Item | Docker Compose | Desenvolvimento Local |
|------|----------------|----------------------|
| Arquivo .env | `.env` | `.env.local` |
| POSTGRES_HOST | `db` | `localhost` |
| POSTGRES_PORT | `5432` | `5433` |
| Comando | `docker compose up` | `uvicorn app.main:app --reload` |

---

## ⚠️ IMPORTANTE

- **NUNCA** altere `POSTGRES_HOST=db` no `.env` da raiz
- O `.env` é usado pelo Docker Compose
- O `.env.local` é usado apenas para desenvolvimento local
- Sempre certifique-se que o PostgreSQL do Docker está rodando antes de iniciar a API localmente
