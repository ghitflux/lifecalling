# Lifecalling - Sistema de Gestão de Casos

Sistema monorepo para gestão de casos com autenticação segura por cookies HttpOnly + CSRF protection.

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 (apps/web) - Porta 3000
- **Backend**: FastAPI (apps/api) - Porta 8000  
- **Database**: PostgreSQL - Porta 5432
- **Autenticação**: Cookies HttpOnly + CSRF double-submit pattern
- **Proxy**: Caddy (produção) - Porta 80/443

## 🚀 Desenvolvimento Local

### 1. Pré-requisitos

- **Node.js** 18+ e **pnpm**
- **Python** 3.11+ e **pip**
- **Docker** e **Docker Compose**
- **Git**

### 2. Clone e Configuração Inicial

```bash
# Clone o repositório
git clone https://github.com/ghitflux/lifecalling.git
cd lifecalling

# Instalar dependências do monorepo
pnpm install
```

### 3. Configurar Variáveis de Ambiente

**Backend (apps/api/.env.local):**
```bash
cd apps/api
cp env.example .env.local
```

Editar `.env.local` com:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lifecalling_dev
DB_USER=lifecalling
DB_PASSWORD=lifecalling
DATABASE_URL=postgresql+psycopg2://lifecalling:lifecalling@localhost:5432/lifecalling_dev

# JWT
JWT_SECRET=dev-secret-key-32-chars-minimum
JWT_ISS=lifecalling
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=86400

# Security
FASTAPI_SECRET_KEY=dev-fastapi-secret-key
CSRF_SECRET=dev-csrf-secret

# Environment
ENV=development
COOKIE_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000

# Uploads
UPLOAD_DIR=./uploads
```

**Frontend (apps/web/.env.local):**
```bash
cd apps/web
cp env.example .env.local
```

Editar `.env.local` com:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development
```

### 4. Iniciar Banco de Dados

```bash
# Na raiz do projeto
docker-compose -f docker-compose.local.yml up db -d

# Aguardar o banco ficar pronto
docker-compose -f docker-compose.local.yml logs db
```

### 5. Configurar Backend

```bash
cd apps/api

# Instalar dependências Python
pip install -r requirements.txt

# Aplicar migrações
alembic upgrade head

# Popular banco com dados de exemplo (opcional)
python app/clean_and_seed.py

# Iniciar servidor de desenvolvimento
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 6. Configurar Frontend

```bash
cd apps/web

# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev
```

### 7. Acessar Aplicação

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 8. Credenciais de Desenvolvimento

Após executar `clean_and_seed.py`, use:
- **Email**: admin@lifecalling.com
- **Senha**: admin123

## 🔐 Autenticação

O sistema utiliza **cookies HttpOnly** com proteção CSRF:

- ✅ **Cookies HttpOnly**: Tokens JWT seguros
- ✅ **CSRF Protection**: Double-submit cookie pattern  
- ✅ **SameSite=Lax**: Proteção básica contra CSRF
- ✅ **Secure em produção**: Cookies seguros apenas em HTTPS

### Como Funciona

1. **Login**: Backend seta cookies `access`, `refresh`, `role`, `csrf_token`
2. **Requisições**: Frontend envia cookies + header `X-CSRF-Token` para POST/PUT/DELETE
3. **Logout**: Backend limpa todos os cookies

## 🚀 Deploy Seguro em Produção

### 1. Deploy Automatizado (Recomendado)

Para deploy completo em VPS, use o script automatizado:

```bash
# No servidor VPS
curl -fsSL https://raw.githubusercontent.com/ghitflux/lifecalling/deploy/.deploy/vps-setup.sh | bash
```

### 2. Deploy Manual Seguro

#### 2.1 Preparar Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y
```

#### 2.2 Clone e Configuração

```bash
# Clone do repositório
git clone https://github.com/ghitflux/lifecalling.git /opt/lifeservicos/src
cd /opt/lifeservicos/src

# Checkout da branch de produção
git checkout deploy
```

#### 2.3 Configurar Ambiente de Produção

```bash
# Gerar secrets seguros
JWT_SECRET=$(openssl rand -hex 32)
FASTAPI_SECRET_KEY=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 16)

# Criar arquivo .env
cat > .env <<EOF
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=lifecalling
DB_USER=lifecalling
DB_PASSWORD=lifecalling
DATABASE_URL=postgresql+psycopg2://lifecalling:lifecalling@db:5432/lifecalling

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_ISS=lifecalling
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=86400

# Security
FASTAPI_SECRET_KEY=${FASTAPI_SECRET_KEY}
CSRF_SECRET=${CSRF_SECRET}

# Environment
ENV=production
COOKIE_DOMAIN=.lifeservicos.com
FRONTEND_URL=https://lifeservicos.com,https://www.lifeservicos.com

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com
NODE_ENV=production

# Uploads
UPLOAD_DIR=/app/uploads

# Backups
TZ=America/Sao_Paulo
PG_BACKUP_CRON=0 3 * * *
PG_BACKUP_KEEP_DAYS=7
PG_BACKUP_KEEP_WEEKS=4
PG_BACKUP_KEEP_MONTHS=3
EOF

chmod 600 .env
```

### 3. Deploy Sem Derrubar Servidor

#### 3.1 Estratégia Blue-Green

```bash
# 1. Fazer backup do banco atual
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lifecalling lifecalling > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull das últimas mudanças
git pull origin deploy

# 3. Build das novas imagens (sem parar os containers)
docker-compose -f docker-compose.prod.yml build

# 4. Aplicar migrações (se houver)
docker-compose -f docker-compose.prod.yml exec api alembic upgrade head

# 5. Restart apenas os serviços que mudaram
docker-compose -f docker-compose.prod.yml up -d --no-deps api web

# 6. Verificar se tudo está funcionando
docker-compose -f docker-compose.prod.yml ps
curl -f http://localhost:8000/health || echo "API não está respondendo"
curl -f http://localhost:3000 || echo "Frontend não está respondendo"
```

#### 3.2 Rollback Seguro (se necessário)

```bash
# Se algo der errado, fazer rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Restaurar backup do banco (se necessário)
docker-compose -f docker-compose.prod.yml exec -T db psql -U lifecalling lifecalling < backup_YYYYMMDD_HHMMSS.sql
```

### 4. Monitoramento e Logs

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de um serviço específico
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web

# Status dos containers
docker-compose -f docker-compose.prod.yml ps

# Uso de recursos
docker stats
```

### 5. Backup Automático

O sistema já inclui backup automático do PostgreSQL:

```bash
# Verificar backups
ls -la /opt/lifeservicos/backups/pg/

# Backup manual
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lifecalling lifecalling > manual_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 6. SSL/TLS Automático

O Caddy já está configurado para SSL automático:

```bash
# Verificar certificados
docker-compose -f docker-compose.prod.yml exec proxy caddy list-certificates

# Forçar renovação (se necessário)
docker-compose -f docker-compose.prod.yml exec proxy caddy reload
```

### 7. Atualizações de Segurança

```bash
# Atualizar dependências do sistema
sudo apt update && sudo apt upgrade -y

# Atualizar imagens Docker
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Limpar imagens antigas
docker image prune -f
```

## 📁 Estrutura do Projeto

```
lifecalling/
├── apps/
│   ├── api/                 # FastAPI Backend
│   │   ├── app/
│   │   │   ├── routers/     # Endpoints da API
│   │   │   ├── security.py  # Autenticação + CSRF
│   │   │   └── main.py      # App FastAPI
│   │   ├── env.example      # Configuração de exemplo
│   │   └── requirements.txt
│   └── web/                 # Next.js Frontend
│       ├── src/
│       │   ├── lib/
│       │   │   ├── api.ts   # Cliente HTTP + CSRF
│       │   │   └── auth.tsx # Context de autenticação
│       │   └── middleware.ts # Proteção de rotas
│       ├── env.example      # Configuração de exemplo
│       └── package.json
├── docker-compose.yml       # Orquestração de containers
└── README.md               # Este arquivo
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Backend standalone
cd lifecalling/apps/api
uvicorn app.main:app --reload

# Frontend standalone  
cd lifecalling/apps/web
pnpm dev

# Build frontend para produção
cd lifecalling/apps/web
pnpm build && pnpm start
```

### Banco de Dados

```bash
# Aplicar migrações
cd lifecalling/apps/api
alembic upgrade head

# Criar nova migração
alembic revision --autogenerate -m "descrição"

# Ver status das migrações
alembic current
```

### Docker

```bash
# Build completo
docker-compose build

# Deploy completo
docker-compose up -d

# Logs em tempo real
docker-compose logs -f

# Parar tudo
docker-compose down
```

## 🛡️ Segurança

### Cookies HttpOnly
- Tokens JWT armazenados em cookies seguros
- Não acessíveis via JavaScript (XSS protection)
- Transmitidos automaticamente pelo navegador

### CSRF Protection
- Double-submit cookie pattern
- Token CSRF em cookie + header para validação
- Proteção em todos os endpoints mutantes

### CORS
- Configuração dinâmica baseada em `FRONTEND_URL`
- `allow_credentials=True` para cookies
- Headers `X-CSRF-Token` permitidos

## 📚 Documentação Adicional

- [Configuração de Autenticação](CONFIGURACAO_AUTH.md)
- [Arquivos de Ambiente](apps/api/env.example) (Backend)
- [Arquivos de Ambiente](apps/web/env.example) (Frontend)

## 🐛 Troubleshooting

### Problemas de Desenvolvimento Local

#### Banco de Dados não Conecta
```bash
# Verificar se o container está rodando
docker-compose -f docker-compose.local.yml ps db

# Ver logs do banco
docker-compose -f docker-compose.local.yml logs db

# Reiniciar o banco
docker-compose -f docker-compose.local.yml restart db
```

#### API não Inicia
```bash
# Verificar dependências Python
cd apps/api
pip install -r requirements.txt

# Verificar variáveis de ambiente
cat .env.local

# Aplicar migrações
alembic upgrade head

# Verificar logs
uvicorn app.main:app --reload --log-level debug
```

#### Frontend não Conecta na API
```bash
# Verificar se a API está rodando
curl http://localhost:8000/health

# Verificar variáveis de ambiente do frontend
cd apps/web
cat .env.local

# Verificar se o proxy está configurado no next.config.ts
```

### Problemas de Produção

#### Deploy Falhou
```bash
# Ver logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs

# Verificar status dos containers
docker-compose -f docker-compose.prod.yml ps

# Fazer rollback
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml up -d
```

#### SSL não Funciona
```bash
# Verificar configuração do Caddy
docker-compose -f docker-compose.prod.yml exec proxy caddy validate

# Verificar certificados
docker-compose -f docker-compose.prod.yml exec proxy caddy list-certificates

# Recarregar configuração
docker-compose -f docker-compose.prod.yml exec proxy caddy reload
```

#### Banco de Dados Corrompido
```bash
# Fazer backup antes de qualquer coisa
docker-compose -f docker-compose.prod.yml exec db pg_dump -U lifecalling lifecalling > emergency_backup.sql

# Verificar integridade
docker-compose -f docker-compose.prod.yml exec db psql -U lifecalling -c "SELECT 1;"

# Restaurar de backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U lifecalling lifecalling < backup_file.sql
```

### Problemas de Autenticação

#### Erro de CSRF
- Verificar se frontend está enviando header `X-CSRF-Token`
- Verificar se cookie `csrf_token` existe
- Verificar se endpoint não está isento de CSRF
- Verificar se `CSRF_SECRET` está configurado

#### Erro de CORS
- Verificar `FRONTEND_URL` no backend
- Verificar `NEXT_PUBLIC_API_BASE_URL` no frontend
- Verificar se `withCredentials: true` está configurado
- Verificar se o domínio está correto

#### Erro de Cookies
- Verificar se `secure=False` em desenvolvimento
- Verificar se `domain` está correto em produção
- Verificar se `SameSite=Lax` está configurado
- Verificar se o navegador aceita cookies

### Problemas de Performance

#### Aplicação Lenta
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de erro
docker-compose -f docker-compose.prod.yml logs | grep -i error

# Verificar conexões de banco
docker-compose -f docker-compose.prod.yml exec db psql -U lifecalling -c "SELECT * FROM pg_stat_activity;"
```

#### Memória Alta
```bash
# Verificar uso de memória por container
docker stats --no-stream

# Limpar cache do Docker
docker system prune -f

# Reiniciar containers com alto uso
docker-compose -f docker-compose.prod.yml restart api web
```

### Comandos de Emergência

```bash
# Parar tudo e reiniciar
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Backup completo do sistema
tar -czf full_backup_$(date +%Y%m%d_%H%M%S).tar.gz /opt/lifeservicos/

# Restaurar sistema completo
tar -xzf full_backup_YYYYMMDD_HHMMSS.tar.gz -C /
```