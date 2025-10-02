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

## 🚀 Deploy para Produção

### Pré-requisitos de Produção

- **Servidor**: Linux (Ubuntu 20.04+ recomendado)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: Mínimo 2GB (recomendado 4GB)
- **Storage**: 10GB+ disponíveis
- **Domínio**: Configurado com DNS apontando para o servidor

### Variáveis de Ambiente (Produção)

Crie um arquivo `.env` com as seguintes variáveis:

```env
# Banco de Dados
POSTGRES_USER=lifecalling_prod
POSTGRES_PASSWORD=<senha-forte-aqui>
POSTGRES_DB=lifecalling_prod
DATABASE_URL=postgresql://lifecalling_prod:<senha>@db:5432/lifecalling_prod

# API
SECRET_KEY=<gere-uma-chave-forte-256-bits>
UPLOAD_DIR=/var/app/uploads
API_PORT=8000

# Next.js
NEXT_PUBLIC_API_URL=https://api.seudominio.com
NEXTAUTH_SECRET=<gere-outra-chave-forte>
NEXTAUTH_URL=https://app.seudominio.com

# Segurança
ALLOWED_ORIGINS=https://app.seudominio.com,https://www.seudominio.com
```

### Passos para Deploy

#### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Criar usuário para a aplicação
sudo useradd -m -s /bin/bash lifecalling
sudo usermod -aG docker lifecalling
```

#### 2. Clonar e Configurar

```bash
# Clonar repositório
cd /home/lifecalling
git clone https://github.com/ghitflux/lifecalling.git
cd lifecalling

# Copiar e configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com valores de produção
```

#### 3. Build e Deploy

```bash
# Build das imagens
docker compose -f docker-compose.prod.yml build

# Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# Executar migrações
docker compose -f docker-compose.prod.yml exec api alembic upgrade head

# Criar usuários iniciais
docker compose -f docker-compose.prod.yml exec api python -m app.seed_demo
```

#### 4. Configurar Nginx (Proxy Reverso)

```nginx
# /etc/nginx/sites-available/lifecalling
server {
    listen 80;
    server_name app.seudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/lifecalling /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar SSL com Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.seudominio.com -d api.seudominio.com
```

#### 5. Monitoramento e Logs

```bash
# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs específicos
docker compose -f docker-compose.prod.yml logs api -f
docker compose -f docker-compose.prod.yml logs web -f

# Status dos containers
docker compose -f docker-compose.prod.yml ps
```

### Backup e Recuperação

#### Backup do Banco de Dados

```bash
# Criar backup
docker compose exec db pg_dump -U lifecalling_prod lifecalling_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker compose exec -T db psql -U lifecalling_prod lifecalling_prod < backup_20251002_153000.sql
```

#### Backup de Uploads

```bash
# Criar backup de arquivos
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/app/uploads

# Restaurar arquivos
tar -xzf uploads_backup_20251002.tar.gz -C /
```

---

## 🔧 Pontos Pendentes e Ajustes Necessários

### Backend (Alta Prioridade)

#### 1. Endpoint `POST /cases/{id}/return-to-calculista`
- **Status**: ⚠️ Não implementado
- **Necessário**: Criar endpoint no FastAPI
- **Arquivo**: `apps/api/app/routers/cases.py`
- **Lógica**:
  ```python
  @r.post("/{case_id}/return-to-calculista")
  async def return_to_calculista(case_id: int, user=Depends(require_roles("admin","supervisor","financeiro"))):
      with SessionLocal() as db:
          case = db.get(Case, case_id)
          if not case:
              raise HTTPException(404, "Case not found")

          # Retornar para status calculista
          case.status = "calculista_pendente"
          case.last_update_at = datetime.utcnow()

          # Registrar evento
          db.add(CaseEvent(
              case_id=case_id,
              type="case.returned_to_calculista",
              payload={"returned_by": user.id},
              created_by=user.id
          ))

          db.commit()

      await eventbus.broadcast("case.updated", {"case_id": case_id, "status": "calculista_pendente"})
      return {"success": True}
  ```

#### 2. Validação de Dados de Simulação
- **Status**: ⚠️ Necessário validar
- **Problema**: Campo `valor_liberado` pode estar null na tabela `simulations`
- **Solução**: Adicionar migration para garantir NOT NULL
- **Arquivo**: Criar nova migration Alembic

#### 3. Logs de Auditoria
- **Status**: ❌ Não implementado
- **Necessário**: Criar tabela `audit_logs`
- **Funcionalidade**: Registrar todas ações administrativas
  - Reatribuições de casos
  - Exclusões em lote
  - Alterações de status críticos
  - Aprovações/rejeições financeiras

### Frontend (Média Prioridade)

#### 1. Modal de Confirmação para Deletar
- **Status**: ⚠️ Implementação parcial
- **Arquivo**: `packages/ui/src/FinanceCard.tsx`
- **Necessário**: Adicionar estado `showDeleteConfirm` e Dialog component
- **Código pendente**:
  ```tsx
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  {/* Modal de confirmação de exclusão */}
  <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
      </DialogHeader>
      <p>Tem certeza que deseja deletar este caso? Esta ação não pode ser desfeita.</p>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={() => {
          onDelete?.(id);
          setShowDeleteConfirm(false);
        }}>
          Deletar Permanentemente
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

#### 2. Tratamento de Erros de Upload
- **Status**: ⚠️ Tratamento básico
- **Necessário**: Melhorar feedback de erros
- **Validações adicionais**:
  - Tamanho máximo do arquivo (10MB)
  - Tipos de arquivo permitidos
  - Mensagem de erro específica por tipo de falha

#### 3. Skeleton Loaders
- **Status**: ❌ Não implementado
- **Necessário**: Substituir "Carregando..." por skeletons animados
- **Componentes afetados**:
  - FinanceCard
  - FinanceMetrics
  - Tabelas de receitas/despesas

### Banco de Dados (Alta Prioridade)

#### 1. Índices para Performance
- **Status**: ⚠️ Parcialmente implementado
- **Necessário**: Criar índices adicionais
- **SQL**:
  ```sql
  -- Índice composto para filtros frequentes
  CREATE INDEX idx_cases_status_created ON cases(status, created_at DESC);
  CREATE INDEX idx_contracts_disbursed_at ON contracts(disbursed_at DESC);
  CREATE INDEX idx_simulations_case_status ON simulations(case_id, status);

  -- Índice para busca de clientes
  CREATE INDEX idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);
  CREATE INDEX idx_clients_cpf ON clients(cpf);
  ```

#### 2. Constraints de Integridade
- **Status**: ⚠️ Básico implementado
- **Necessário**: Adicionar constraints adicionais
- **Exemplos**:
  ```sql
  -- Garantir que valor liberado é positivo
  ALTER TABLE simulations ADD CONSTRAINT chk_liberado_positive
    CHECK (liberado_total > 0);

  -- Garantir que parcelas pagas não excedem total
  ALTER TABLE contracts ADD CONSTRAINT chk_installments_valid
    CHECK (paid_installments <= installments);
  ```

### Testes (Alta Prioridade)

#### 1. Testes E2E do Fluxo Financeiro
- **Status**: ❌ Não implementado
- **Necessário**: Criar testes com Playwright/Cypress
- **Fluxo a testar**:
  1. Login como financeiro
  2. Ver lista de casos aprovados
  3. Anexar documento
  4. Efetivar liberação
  5. Verificar caso liberado
  6. Ver detalhes completos

#### 2. Testes de Integração API
- **Status**: ❌ Não implementado
- **Necessário**: Testes pytest para endpoints críticos
- **Exemplos**:
  - `POST /finance/disburse-simple`
  - `POST /cases/{id}/return-to-calculista`
  - `POST /finance/incomes`
  - `POST /finance/expenses`

### Documentação (Média Prioridade)

#### 1. API Documentation
- **Status**: ✅ Swagger implementado
- **Necessário**: Melhorar descrições e exemplos
- **Adicionar**: Exemplos de request/response em cada endpoint

#### 2. Manual do Usuário
- **Status**: ❌ Não criado
- **Necessário**: Documentação para usuários finais
- **Tópicos**:
  - Como fazer upload de documentos
  - Como efetivar liberação
  - Como adicionar receitas/despesas
  - Fluxo completo de um caso

### Segurança (Alta Prioridade)

#### 1. Rate Limiting
- **Status**: ❌ Não implementado
- **Necessário**: Proteção contra ataques de força bruta
- **Implementar**: slowapi ou similar

#### 2. Validação de Arquivos Upload
- **Status**: ⚠️ Validação básica
- **Necessário**: Scan de malware e validação de conteúdo
- **Ferramentas**: ClamAV ou similar

#### 3. Logs de Segurança
- **Status**: ❌ Não implementado
- **Necessário**: Registro de tentativas de login, acesso negado, etc.

---

## 📋 Checklist de Validação Pré-Deploy

### Backend
- [ ] Todos os endpoints críticos testados
- [ ] Migrações aplicadas sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Logs estruturados e informativos
- [ ] Tratamento de erros robusto
- [ ] Backup automático configurado

### Frontend
- [ ] Build de produção funcionando
- [ ] Variáveis de ambiente corretas
- [ ] Feedback visual em todas ações
- [ ] Tratamento de erros de rede
- [ ] Performance otimizada (bundle size)
- [ ] SEO básico implementado

### Infraestrutura
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Nginx como proxy reverso
- [ ] Containers com health checks
- [ ] Monitoramento ativo
- [ ] Alertas configurados

### Dados
- [ ] Seed data removido
- [ ] Dados de teste limpos
- [ ] Backup inicial criado
- [ ] Índices de performance criados
- [ ] Constraints validadas

---

**Data da Validação D1**: 25/09/2025
**Status**: ✅ APROVADO PARA D2
**Última Atualização**: 02/10/2025
**Próxima Revisão**: Deploy para Produção