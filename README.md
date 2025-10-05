# Lifecalling - Sistema de Gestão de Atendimentos

Sistema completo de gestão de atendimentos financeiros com PostgreSQL, FastAPI e Next.js.

## 🚀 Início Rápido

### Pré-requisitos

- **Docker Desktop** (instalado e rodando)
- **Git**

### Iniciar Ambiente de Desenvolvimento

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Ou manualmente:**
```bash
docker compose up -d
```

### 🌐 Acessar Aplicação

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal Next.js |
| **API** | http://localhost:8000 | Backend FastAPI |
| **API Docs** | http://localhost:8000/docs | Documentação Swagger |
| **PostgreSQL** | localhost:5432 | Banco de dados |

## 📁 Estrutura do Projeto

```
lifecallingv1/
├── docker-compose.yml         # Orquestração Docker
├── .env                       # Variáveis de ambiente
├── start-dev.bat             # Script Windows
├── start-dev.sh              # Script Linux/Mac
└── lifecalling/
    ├── apps/
    │   ├── api/              # Backend FastAPI
    │   │   ├── Dockerfile.dev
    │   │   ├── app/
    │   │   ├── migrations/   # Migrações Alembic
    │   │   └── requirements.txt
    │   └── web/              # Frontend Next.js
    │       ├── Dockerfile.dev
    │       ├── src/
    │       └── package.json
    └── packages/
        ├── types/            # Tipos TypeScript compartilhados
        └── ui/               # Componentes UI compartilhados
```

## 🛠️ Comandos Úteis

### Docker

```bash
# Ver status
docker compose ps

# Ver logs
docker compose logs -f
docker compose logs -f api
docker compose logs -f web

# Parar tudo
docker compose down

# Reconstruir
docker compose build
docker compose up -d --build

# Limpar tudo (remove volumes/dados)
docker compose down -v
```

### Migrações do Banco

```bash
# Aplicar migrações
docker compose exec api alembic upgrade head

# Ver migração atual
docker compose exec api alembic current

# Criar nova migração
docker compose exec api alembic revision -m "descrição"

# Reverter última migração
docker compose exec api alembic downgrade -1
```

### Acessar Containers

```bash
# API
docker compose exec api bash

# Banco de dados
docker compose exec db psql -U lifecalling -d lifecalling

# Frontend
docker compose exec web sh
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)

```env
# PostgreSQL
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=lifecalling
POSTGRES_USER=lifecalling
POSTGRES_PASSWORD=lifecalling

# JWT
JWT_SECRET=dev-secret-key-change-in-production

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
DEBUG=true
ENVIRONMENT=development
```

## 📊 Funcionalidades

- ✅ Importação de arquivos iNETConsig
- ✅ Gestão de Clientes
- ✅ Controle de Contratos
- ✅ Esteira de Atendimentos
- ✅ Dashboards e KPIs
- ✅ Sistema de Autenticação JWT
- ✅ Upload de Arquivos

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Erro de migração

```bash
# Resetar banco (apaga dados!)
docker compose down -v
docker compose up -d
docker compose exec api alembic upgrade head
```

### Reinstalar dependências

```bash
# API
docker compose down
docker compose build --no-cache api
docker compose up -d

# Frontend
docker compose down
docker compose build --no-cache web
docker compose up -d
```

## 📝 Notas Importantes

- ⚠️ **NUNCA usar SQLite** - Sempre PostgreSQL via Docker
- 🔧 **Ambiente de desenvolvimento** - Não fazer build de produção ainda
- 🐳 **Docker obrigatório** - Todos os serviços rodam em containers
- 🔄 **Hot reload ativo** - Código atualiza automaticamente

## 🤝 Desenvolvimento

Este projeto usa:
- **Backend:** FastAPI + Python 3.11 + SQLAlchemy + Alembic
- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **Banco:** PostgreSQL 15
- **Workspaces:** pnpm workspaces para monorepo

---

**Para iniciar agora:**
```bash
docker compose up -d
```

🎉 **Frontend:** http://localhost:3000
🚀 **API:** http://localhost:8000/docs
