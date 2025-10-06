# Lifecalling - Sistema de Gestão de Casos

Sistema monorepo para gestão de casos com autenticação segura por cookies HttpOnly + CSRF protection.

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 (apps/web) - Porta 3000
- **Backend**: FastAPI (apps/api) - Porta 8000  
- **Database**: PostgreSQL - Porta 5432
- **Autenticação**: Cookies HttpOnly + CSRF double-submit pattern

## 🚀 Desenvolvimento Local

### 1. Configurar Ambiente

**Backend:**
```bash
cd lifecalling/apps/api
cp env.example .env.local
# Editar .env.local com suas configurações
```

**Frontend:**
```bash
cd lifecalling/apps/web
cp env.example .env.local
# Editar .env.local com suas configurações
```

### 2. Iniciar Banco de Dados

```bash
cd lifecalling
docker-compose up db -d
```

### 3. Configurar Backend

```bash
cd lifecalling/apps/api
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Configurar Frontend

```bash
cd lifecalling/apps/web
pnpm install --frozen-lockfile
pnpm dev
```

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

## 🐳 Deploy com Docker

### 1. Build e Deploy

```bash
cd lifecalling
docker-compose build
docker-compose up -d
```

### 2. Configurar Variáveis de Produção

**Backend (.env):**
```env
ENV=production
COOKIE_DOMAIN=.lifeservicos.com
FRONTEND_URL=https://lifeservicos.com,https://www.lifeservicos.com
JWT_SECRET=your-secure-secret-32-chars-minimum
```

**Frontend (.env):**
```env
NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com
NODE_ENV=production
```

### 3. Migrações

```bash
# Aplicar migrações
docker-compose exec api alembic upgrade head
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

### Erro de CSRF
- Verificar se frontend está enviando header `X-CSRF-Token`
- Verificar se cookie `csrf_token` existe
- Verificar se endpoint não está isento de CSRF

### Erro de CORS
- Verificar `FRONTEND_URL` no backend
- Verificar `NEXT_PUBLIC_API_BASE_URL` no frontend
- Verificar se `withCredentials: true` está configurado

### Erro de Cookies
- Verificar se `secure=False` em desenvolvimento
- Verificar se `domain` está correto em produção
- Verificar se `SameSite=Lax` está configurado