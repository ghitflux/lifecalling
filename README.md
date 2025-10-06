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

## 🔐 Configuração do NextAuth com JWT

### Instalação

No diretório do frontend (`apps/web`):

```bash
# Instalar NextAuth
pnpm add next-auth

# Instalar adaptadores JWT (opcional)
pnpm add @auth/prisma-adapter  # Se usar Prisma
```

### Configuração Básica

1. **Criar arquivo de configuração** `apps/web/src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Validar credenciais com sua API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!response.ok) {
          return null
        }

        const user = await response.json()
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Usar JWT em vez de database sessions
    maxAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
})
```

2. **Criar route handler** `apps/web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

3. **Adicionar Provider** `apps/web/src/app/layout.tsx`:

```typescript
import { SessionProvider } from "next-auth/react"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

### Variáveis de Ambiente

Adicionar ao `.env.local`:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Uso nos Componentes

```typescript
"use client"
import { useSession, signIn, signOut } from "next-auth/react"

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === "loading") return <p>Carregando...</p>

  if (session) {
    return (
      <>
        <p>Logado como {session.user?.email}</p>
        <button onClick={() => signOut()}>Sair</button>
      </>
    )
  }

  return (
    <>
      <p>Não logado</p>
      <button onClick={() => signIn()}>Entrar</button>
    </>
  )
}
```

### Middleware de Proteção

Criar `apps/web/src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Rotas públicas
  const publicRoutes = ["/login", "/", "/api/auth"]
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Redirecionar para login se não autenticado
  if (!req.auth && !isPublicRoute) {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

### Vantagens da Estratégia JWT

- ✅ **Stateless**: Não precisa armazenar sessões no servidor
- ✅ **Escalável**: Funciona bem em ambientes distribuídos
- ✅ **Performance**: Menos consultas ao banco de dados
- ✅ **Simplicidade**: Não precisa de tabelas de sessão

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
docker compose up -d
docker compose exec api alembic upgrade head
```

### Reinstalar dependências

```bash
# API
docker compose build --no-cache api
docker compose up -d

# Frontend
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
