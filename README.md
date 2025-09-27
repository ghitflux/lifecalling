# LifeCalling

Uma aplicação full-stack moderna para gerenciamento de chamadas e comunicação, construída com Next.js, FastAPI e PostgreSQL.

## 🚀 Tecnologias

### Frontend
- **Next.js 15** - Framework React para produção
- **React 19** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **Tailwind CSS** - Framework CSS utilitário
- **Radix UI** - Componentes acessíveis e customizáveis
- **Tanstack Query** - Gerenciamento de estado do servidor
- **Zustand** - Gerenciamento de estado global
- **Storybook** - Desenvolvimento e documentação de componentes

### Backend
- **FastAPI** - Framework web moderno e rápido para Python
- **SQLAlchemy** - ORM para Python
- **Alembic** - Migrações de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Uvicorn** - Servidor ASGI

### DevOps & Ferramentas
- **Docker & Docker Compose** - Containerização
- **pnpm** - Gerenciador de pacotes rápido
- **ESLint** - Linting para JavaScript/TypeScript
- **Monorepo** - Arquitetura de repositório único

## ✅ Status Final - Sistema Completo

**STATUS: ✅ PRODUÇÃO - Monorepo completo implementado**

### Checklist Final Completo

- ✅ **Monorepo**: PNPM workspaces configurado com apps/ e packages/
- ✅ **Design System**: packages/ui com shadcn/ui + Tailwind integrados
- ✅ **Tipos**: packages/types com geração OpenAPI automática
- ✅ **Frontend**: Next.js 15 + React Query + Axios com interceptors 401
- ✅ **Esteira Flow**: Login → Esteira Global/Minha → Detalhes → Calculista
- ✅ **Simulação**: Formulário completo com função PRICE e Aprovar/Reprovar
- ✅ **WebSocket**: Tempo real com invalidação automática de queries
- ✅ **Storybook**: V8 com stories para todos os componentes
- ✅ **Scripts**: Desenvolvimento, build, tipos, linting integrados

## 📁 Estrutura do Projeto

```
lifecalling/
├── apps/
│   ├── api/          # Backend FastAPI
│   └── web/          # Frontend Next.js
├── packages/
│   ├── types/        # Tipos TypeScript compartilhados
│   └── ui/           # Componentes UI compartilhados
├── scripts/          # Scripts de automação e utilitários
│   ├── migrate.ps1   # Migração de banco (Windows)
│   ├── migrate.sh    # Migração de banco (Linux/Mac)
│   ├── dev.ps1       # Script de desenvolvimento
│   ├── dev.py        # Utilitários Python
│   ├── start.sh      # Inicialização do projeto
│   └── *.py          # Scripts de dados e testes
├── docs/             # Documentação do projeto
│   ├── CLAUDE.md     # Histórico de desenvolvimento
│   ├── DEV_README.md # Guia de desenvolvimento
│   └── *.md          # Documentações específicas
├── data/             # Arquivos de dados para desenvolvimento
│   ├── cookies.txt   # Cookies de sessão
│   └── *.txt         # Dados de exemplo
├── tests/            # Testes (estrutura planejada)
│   ├── unit/         # Testes unitários
│   ├── integration/  # Testes de integração
│   └── e2e/          # Testes end-to-end
└── docker-compose.yml # Configuração Docker
```

## 🛠️ Pré-requisitos

- **Node.js** 18+ 
- **pnpm** 8+
- **Docker** e **Docker Compose**
- **Python** 3.11+ (para desenvolvimento local da API)

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/ghitflux/lifecalling.git
cd lifecalling
```

### 2. Instale as dependências
```bash
pnpm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```env
# Database
POSTGRES_USER=lifecalling
POSTGRES_PASSWORD=lifecalling123
POSTGRES_DB=lifecalling
DATABASE_URL=postgresql://lifecalling:lifecalling123@localhost:5432/lifecalling

# API
SECRET_KEY=your-secret-key-here
UPLOAD_DIR=/app/uploads

# Other configurations...
```

### 4. Execute a aplicação

#### Windows (PowerShell)
```powershell
.\start.ps1
```

#### Linux/Mac
```bash
./start.sh
```

O script irá:
- Verificar dependências
- Iniciar os serviços Docker (PostgreSQL)
- Executar migrações do banco de dados
- Iniciar a API (porta 8000)
- Iniciar o frontend (porta 3000)

## 🌐 URLs da Aplicação

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **Documentação da API (Swagger)**: http://localhost:8000/docs
- **Storybook**: http://localhost:6006

## 📝 Scripts Disponíveis

### Desenvolvimento
```bash
# Frontend
pnpm dev:web

# API (com Docker)
pnpm dev:api

# Storybook
pnpm storybook
```

### Build e Deploy
```bash
# Build do frontend
pnpm build

# Lint
pnpm lint

# Gerar tipos TypeScript
pnpm types:gen
```

### Docker
```bash
# Ver logs da API
docker compose logs api -f

# Parar todos os serviços
docker compose down

# Reset completo do banco de dados
docker compose down -v
```

## 🗄️ Banco de Dados

### Migrações

#### Windows
```powershell
.\migrate.ps1
```

#### Linux/Mac
```bash
./migrate.sh
```

### Estrutura
O banco de dados PostgreSQL é gerenciado através do SQLAlchemy com Alembic para migrações. As migrações são executadas automaticamente durante a inicialização.

## 🧪 Testes

```bash
# Executar testes do frontend
pnpm --filter ./apps/web test

# Executar testes com coverage
pnpm --filter ./apps/web test:coverage
```

## 📚 Documentação

- **API**: Acesse `/docs` para documentação interativa do Swagger
- **Componentes**: Execute `pnpm storybook` para visualizar a biblioteca de componentes
- **Tipos**: Documentação dos tipos TypeScript em `packages/types/`

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a [documentação da API](http://localhost:8000/docs)
2. Consulte os logs: `docker compose logs api -f`
3. Abra uma [issue](https://github.com/ghitflux/lifecalling/issues)

## 🔧 Troubleshooting

### Problemas Comuns

**Erro de porta em uso:**
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :8000
```

**Problemas com Docker:**
```bash
# Limpar containers e volumes
docker compose down -v
docker system prune -f
```

**Problemas com dependências:**
```bash
# Limpar cache do pnpm
pnpm store prune
rm -rf node_modules
pnpm install
```

---

Desenvolvido com ❤️ pela equipe LifeCalling

## Arquitetura

### Stack Tecnológica
- **Backend**: FastAPI + Python 3.11
- **Banco de Dados**: PostgreSQL
- **ORM**: SQLAlchemy 2.0
- **Migrações**: Alembic
- **Autenticação**: JWT com cookies HttpOnly
- **WebSocket**: FastAPI WebSocket support
- **Containerização**: Docker + Docker Compose

### Estrutura do Projeto
```
lifecalling/
├── apps/api/                 # API principal
│   ├── app/
│   │   ├── routers/         # Endpoints organizados por módulo
│   │   │   ├── auth.py      # Autenticação e autorização
│   │   │   ├── cases.py     # Gestão de casos
│   │   │   ├── imports.py   # Importação de dados
│   │   │   ├── attachments.py # Upload de anexos
│   │   │   └── ws.py        # WebSocket
│   │   ├── models.py        # Modelos SQLAlchemy
│   │   ├── security.py      # JWT e hashing
│   │   ├── rbac.py          # Controle de acesso
│   │   └── db.py           # Configuração do banco
│   ├── migrations/          # Migrações Alembic
│   ├── Dockerfile
│   └── requirements.txt
├── docker.compose.yml       # Orquestração dos serviços
└── README.md               # Este arquivo
```

## Funcionalidades Principais

### 1. Autenticação e Autorização
- **Usuários**: admin, supervisor, financeiro, calculista, atendente
- **JWT**: Tokens access/refresh em cookies HttpOnly
- **RBAC**: Controle granular por endpoint e papel

### 2. Gestão de Casos
- **CRUD completo**: Criar, listar, visualizar, atualizar casos
- **Atribuição**: Casos podem ser atribuídos a usuários
- **Status**: Controle de estados (novo, em_atendimento, etc.)
- **Busca**: Por nome, CPF ou matrícula do cliente

### 3. Importação de Dados
- **Formato TXT**: Parser para arquivos de folha de pagamento
- **UPSERT**: Atualização ou criação de clientes/casos
- **Contadores**: Tracking de created/updated/errors/skipped
- **Validação**: CPF com 11 dígitos, formato de linha específico

### 4. Anexos
- **Upload**: Suporte a arquivos diversos
- **Organização**: Por caso, com metadados (mime, size, etc.)
- **Armazenamento**: Sistema de arquivos local (/var/app/uploads)

### 5. WebSocket
- **Tempo Real**: Comunicação bidirecional
- **Endpoint**: `/ws` para conexões WebSocket
- **Casos de Uso**: Notificações, atualizações em tempo real

### 6. Observabilidade
- **Logs**: Estruturados via FastAPI/Uvicorn
- **Segurança**: Cookies HttpOnly, SameSite=lax
- **Monitoramento**: Logs de requests, erros e operações

## Instalação e Execução

### Pré-requisitos
- Docker e Docker Compose
- Git

### Passos
1. **Clone o repositório**
   ```bash
   git clone <repo-url>
   cd lifecalling
   ```

2. **Inicie os serviços**
   ```bash
   docker compose -f docker.compose.yml up -d
   ```

3. **Execute as migrações**
   ```bash
   docker compose -f docker.compose.yml exec api alembic upgrade head
   ```

4. **Crie usuários iniciais**
   ```bash
   docker compose -f docker.compose.yml exec api python seed.py
   ```

5. **Acesse a aplicação**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - WebSocket: ws://localhost:8000/ws

## Usuários de Teste

| Email | Senha | Papel |
|-------|-------|-------|
| admin@demo.local | 123456 | admin |
| sup@demo.local | 123456 | supervisor |
| fin@demo.local | 123456 | financeiro |
| calc@demo.local | 123456 | calculista |
| aten@demo.local | 123456 | atendente |

## Endpoints Principais

### Autenticação
- `POST /auth/login` - Login com email/senha
- `POST /auth/logout` - Logout e limpeza de cookies

### Casos
- `GET /cases` - Listar casos (com filtros)
- `GET /cases/{id}` - Detalhes de um caso
- `POST /cases/{id}/assign` - Atribuir caso ao usuário logado
- `PATCH /cases/{id}` - Atualizar dados do cliente

### Importação
- `POST /imports` - Upload de arquivo TXT
- `GET /imports/{id}` - Detalhes do batch de importação

### Anexos
- `POST /cases/{id}/attachments` - Upload de anexo para caso

### WebSocket
- `WS /ws` - Conexão WebSocket para tempo real

## Scripts cURL

Consulte o arquivo `curl_scripts.md` para exemplos completos de uso da API.

## Banco de Dados

### Modelos Principais
- **User**: Usuários do sistema com papéis
- **Client**: Clientes com CPF, matrícula e dados pessoais
- **Case**: Casos vinculados a clientes
- **CaseEvent**: Histórico de eventos dos casos
- **Attachment**: Anexos vinculados a casos
- **ImportBatch/ImportRow**: Controle de importações

### Relacionamentos
- Client 1:N Case
- User 1:N Case (assigned_user)
- Case 1:N CaseEvent
- Case 1:N Attachment

## Segurança

### Implementações
- ✅ Cookies HttpOnly para JWT
- ✅ SameSite=lax para CSRF protection
- ✅ Hashing bcrypt para senhas
- ✅ Validação de CPF (11 dígitos)
- ✅ RBAC por endpoint
- ✅ Sanitização de uploads

### Próximos Passos (D2)
- [ ] Rate limiting
- [ ] HTTPS obrigatório
- [ ] Audit logs
- [ ] Backup automatizado
- [ ] Monitoramento avançado

## Desenvolvimento

### Comandos Úteis
```bash
# Logs da API
docker compose -f docker.compose.yml logs api -f

# Acesso ao container
docker compose -f docker.compose.yml exec api bash

# Reset do banco
docker compose -f docker.compose.yml down -v
docker compose -f docker.compose.yml up -d

# Nova migração
docker compose -f docker.compose.yml exec api alembic revision --autogenerate -m "descrição"
```

### Estrutura de Desenvolvimento
- **Modular**: Routers separados por funcionalidade
- **Type Hints**: Python tipado com Pydantic
- **Async**: Suporte assíncrono nativo
- **Testável**: Estrutura preparada para testes

---

**Data da Validação D1**: 25/09/2025  
**Status**: ✅ APROVADO PARA D2  
**Próxima Revisão**: D2 - Implementação completa