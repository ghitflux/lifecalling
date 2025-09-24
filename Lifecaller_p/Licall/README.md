# Licall - Sistema de Atendimentos

Sistema completo de gestão de atendimentos e simulações de empréstimos com máquina de estados, RBAC e controle de concorrência.

## 🚀 Stack Tecnológica

- **Next.js 15** (App Router) + **TypeScript**
- **PostgreSQL** (Docker) + **Prisma** ORM
- **NextAuth v5** (Credentials) + **RBAC**
- **Tailwind CSS** + **Design Tokens**
- **Storybook** + **Vitest**
- **Server Actions** para transições de estado
- **Chart.js** para visualizações
- **Zod** para validações

## 🏗️ Arquitetura

### **Entidades Principais**
- **User**: Usuários com roles (atendente, calculista, gerente_fechamento, financeiro, superadmin)
- **Atendimento**: Fluxo principal com 13 estados e sistema de lock
- **AuditLog**: Rastreamento completo de todas as ações

### **Estados do Atendimento**
```
DISPONIVEL → ATRIBUIDO → PENDENTE_CALCULO → SIMULACAO_APROVADA/REPROVADA
                                                     ↓
                                              EM_FECHAMENTO → CONTRATO_CONFIRMADO
                                                     ↓
                                              ENVIADO_FINANCEIRO → CONTRATO_ATIVADO
                                                     ↓
                                              ENCERRADO_*
```

### **Sistema RBAC**
- **atendente**: Esteira global, assumir, enviar para cálculo/fechamento/financeiro
- **calculista**: Fila de cálculo, aprovar/reprovar simulações
- **gerente_fechamento**: Fila de fechamento, aprovar contratos
- **financeiro**: Fila financeiro, confirmar ativações
- **superadmin**: Acesso completo a todas as funcionalidades

## 🛠️ Como Rodar Localmente

### **Pré-requisitos**
- **Node.js 20+**
- **Docker** e **Docker Compose**

### **1. Configuração Inicial**
```bash
# Clone o repositório
git clone https://github.com/ghitflux/licall.git
cd licall

# Copie o arquivo de ambiente
cp .env.example .env.local
```

### **2. Ajuste as Variáveis de Ambiente**
Edite `.env.local` e configure:
```env
# Database
DATABASE_URL="postgresql://licall:licall_pwd@localhost:5432/licall?schema=public"

# NextAuth - MUDE EM PRODUÇÃO!
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# Environment
NODE_ENV="development"
```

### **3. Setup Completo**
```bash
# Instalar dependências
npm install

# Subir banco PostgreSQL
npm run db:up

# Aguardar inicialização do banco
npm run db:wait

# Gerar Prisma client
npm run prisma:gen

# Executar migrations
npm run prisma:migrate

# Resetar banco e executar seeds
npm run db:reset
```

### **4. Executar a Aplicação**
```bash
# Desenvolvimento
npm run dev

# Storybook (opcional)
npm run storybook
```

### **5. Acessar o Sistema**
- **App**: http://localhost:3000
- **Storybook**: http://localhost:6006 (se executado)

### **6. Credenciais de Teste**
| Role | Email | Senha |
|------|-------|--------|
| Atendente | `atendente@licall.dev` | `dev123` |
| Calculista | `calculista@licall.dev` | `dev123` |
| Gerente | `gerente@licall.dev` | `dev123` |
| Financeiro | `financeiro@licall.dev` | `dev123` |
| SuperAdmin | `admin@licall.dev` | `dev123` |

## 📝 Scripts Disponíveis

```bash
# Database
npm run db:up          # Subir PostgreSQL
npm run db:down        # Parar PostgreSQL
npm run db:wait        # Aguardar banco inicializar
npm run db:reset       # Reset + migrations + seeds

# Prisma
npm run prisma:gen     # Gerar client
npm run prisma:migrate # Aplicar migrations

# Development
npm run dev            # Next.js dev server
npm run build          # Build para produção
npm run start          # Executar build de produção

# Tools
npm run storybook      # Storybook dev server
npm run test           # Executar testes
npm run lint           # ESLint
npm run type-check     # TypeScript check
```

## 🐳 Deploy com Docker

### **Build da Imagem**
```bash
docker build -t licall:latest .
```

### **Executar com Docker Compose**
```bash
# Para produção, ajuste as variáveis de ambiente no docker-compose.yml
docker compose -f docker-compose.prod.yml up -d
```

### **Deploy na Hostinger**
1. Configure as variáveis de ambiente:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   NEXTAUTH_SECRET="secure-secret-key-for-production"
   NEXTAUTH_URL="https://your-domain.com"
   AUTH_TRUST_HOST="true"
   NODE_ENV="production"
   ```

2. Execute migrations no servidor:
   ```bash
   npx prisma migrate deploy
   ```

3. Execute seeds (opcional):
   ```bash
   npx tsx scripts/seed.ts
   ```

## 🧪 Testing e Development

### **Executar Testes**
```bash
npm run test           # Executar todos os testes
npm run test:watch     # Executar em modo watch
```

### **Storybook**
```bash
npm run storybook      # Dev server
npm run build-storybook # Build estático
```

### **Linting**
```bash
npm run lint           # ESLint
npm run type-check     # TypeScript check
```

## 📁 Estrutura do Projeto

```
licall/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/signin/      # Página de login
│   │   ├── calc/               # Fila calculista
│   │   ├── closing/            # Fila gerente
│   │   ├── finance/            # Fila financeiro
│   │   ├── atendimentos/[id]/  # Detalhe atendimento
│   │   └── actions/            # Server Actions
│   ├── lib/                    # Utilitários core
│   │   ├── auth.ts             # NextAuth config
│   │   ├── prisma.ts           # Prisma client
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── state.ts            # Máquina de estados
│   │   └── validators.ts       # Validações Zod
│   ├── ui/                     # Design system
│   │   ├── components/         # Componentes UI
│   │   ├── styles/tokens.css   # Design tokens
│   │   └── stories/            # Storybook stories
│   └── middleware.ts           # Proteção de rotas
├── prisma/                     # Database schema
├── scripts/                    # Scripts utilitários
├── .storybook/                 # Storybook config
└── docker-compose.yml          # PostgreSQL local
```

## 🔐 Funcionalidades Implementadas

### **Autenticação & Autorização**
- ✅ Login com email/senha (NextAuth v5 Credentials)
- ✅ Sistema RBAC com 5 roles
- ✅ Proteção de rotas via middleware
- ✅ Interface condicional baseada em permissões

### **Gestão de Atendimentos**
- ✅ Máquina de estados com 13 status
- ✅ Sistema de lock persistente até finalização
- ✅ Transições controladas via Server Actions
- ✅ Auditoria completa de todas as ações
- ✅ 4 filas especializadas por role

### **Interface Usuário**
- ✅ Design system completo com tokens CSS
- ✅ Componentes reutilizáveis e responsivos
- ✅ Storybook com playground de tema
- ✅ Formulários para cálculos e observações
- ✅ Dashboards com gráficos (Chart.js)

### **Dados & Persistência**
- ✅ PostgreSQL com Prisma ORM
- ✅ Migrations e seeds automáticos
- ✅ Relacionamentos entre entidades
- ✅ Logs de auditoria estruturados
- ✅ Validações com Zod

## 🚨 Próximos Passos

1. **Implementar testes automatizados** (Vitest configurado)
2. **Adicionar upload de anexos**
3. **Criar dashboard com métricas avançadas**
4. **Implementar notificações em tempo real**
5. **Adicionar exportação de relatórios**
6. **Melhorar performance com cache**
7. **Implementar logs estruturados**

## 📖 Documentação Adicional

- [Prisma Schema](./prisma/schema.prisma) - Estrutura do banco
- [Storybook](http://localhost:6006) - Design system
- [Server Actions](./src/app/actions/) - Lógica de negócio
- [RBAC](./src/lib/rbac.ts) - Controle de acesso

---

**Licall** - Sistema profissional de atendimentos com máquina de estados e controle de concorrência.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

Contribuições são bem-vindas! Por favor, abra uma issue ou envie um pull request.

## 📞 Contato

Para dúvidas ou suporte, entre em contato através do GitHub Issues.