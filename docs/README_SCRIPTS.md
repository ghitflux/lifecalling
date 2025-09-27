# Scripts de Inicialização e Migração - Lifecalling

Este documento descreve os scripts criados para facilitar a inicialização e gerenciamento do projeto Lifecalling.

## 📋 Scripts Disponíveis

### 🚀 Scripts de Inicialização

#### Windows (PowerShell)
```powershell
.\start.ps1
```

#### Linux/macOS (Bash)
```bash
./start.sh
```

**Funcionalidades:**
- ✅ Verifica dependências (Docker, Node.js, pnpm)
- ✅ Valida arquivo `.env`
- ✅ Inicia serviços Docker (banco de dados)
- ✅ Instala dependências do projeto
- ✅ Executa migrações pendentes
- ✅ Inicia servidores (API + Web)
- ✅ Mostra URLs e comandos úteis

### 📊 Scripts de Migração

#### Windows (PowerShell)
```powershell
.\migrate.ps1 [ação] [revisão]
```

#### Linux/macOS (Bash)
```bash
./migrate.sh [ação] [revisão]
```

**Ações disponíveis:**
- `upgrade` - Aplica migrações (padrão)
- `downgrade` - Reverte migrações
- `current` - Mostra revisão atual
- `history` - Mostra histórico de migrações
- `heads` - Mostra cabeças das migrações

## 🎯 Uso Rápido

### Primeira execução
```bash
# Windows
.\start.ps1

# Linux/macOS
./start.sh
```

### Apenas migrações
```bash
# Windows
.\migrate.ps1

# Linux/macOS
./migrate.sh
```

### Pular migrações na inicialização
```bash
# Windows
.\start.ps1 -SkipMigrations

# Linux/macOS
./start.sh --skip-migrations
```

### Modo produção
```bash
# Windows
.\start.ps1 -DevMode:$false

# Linux/macOS
./start.sh --prod
```

## 📖 Exemplos de Uso

### Inicialização Completa
```bash
# Executa tudo: dependências, migrações e servidores
.\start.ps1
```

### Reverter Última Migração
```bash
# Reverte uma migração
.\migrate.ps1 downgrade -1
```

### Ver Status das Migrações
```bash
# Mostra revisão atual
.\migrate.ps1 current

# Mostra histórico completo
.\migrate.ps1 history
```

### Inicialização Rápida (sem migrações)
```bash
# Útil quando as migrações já foram executadas
.\start.ps1 -SkipMigrations
```

## 🌐 URLs Disponíveis

Após a inicialização bem-sucedida:

- **API**: http://localhost:8000
- **Documentação (Swagger)**: http://localhost:8000/docs
- **Aplicação Web**: http://localhost:3000

## 🔧 Comandos Úteis

### Ver logs da API
```bash
docker compose -f docker.compose.yml logs api -f
```

### Parar todos os serviços
```bash
docker compose -f docker.compose.yml down
```

### Reset completo do banco
```bash
docker compose -f docker.compose.yml down -v
```

### Acessar container da API
```bash
docker compose -f docker.compose.yml exec api bash
```

## 🛠️ Pré-requisitos

### Dependências Obrigatórias
- **Docker** e **Docker Compose**
- **Node.js** (versão 18+)
- **pnpm** (gerenciador de pacotes)

### Arquivo de Configuração
- **`.env`** - Deve existir na raiz do projeto

### Verificação de Dependências
Os scripts verificam automaticamente se todas as dependências estão instaladas.

## 🚨 Solução de Problemas

### Erro: "Docker não está rodando"
```bash
# Inicie o Docker Desktop ou serviço Docker
sudo systemctl start docker  # Linux
```

### Erro: "Arquivo .env não encontrado"
```bash
# Crie o arquivo .env baseado no exemplo
cp .env.example .env  # Se existir
```

### Erro: "Timeout aguardando banco de dados"
```bash
# Verifique se o PostgreSQL está rodando
docker compose -f docker.compose.yml logs db
```

### Erro: "Porta já em uso"
```bash
# Verifique processos usando as portas
netstat -tulpn | grep :8000  # Linux
netstat -ano | findstr :8000  # Windows
```

## 📝 Estrutura dos Scripts

### Fluxo de Inicialização
1. **Verificação de dependências**
2. **Validação de configuração**
3. **Inicialização do banco de dados**
4. **Instalação de dependências**
5. **Execução de migrações**
6. **Inicialização dos servidores**
7. **Exibição de status**

### Tratamento de Erros
- ✅ Verificação de pré-requisitos
- ✅ Validação de arquivos de configuração
- ✅ Timeout para aguardar serviços
- ✅ Cleanup automático em caso de erro
- ✅ Mensagens de erro claras e coloridas

## 🎨 Recursos dos Scripts

### Interface Amigável
- 🎨 **Cores** para diferentes tipos de mensagem
- 📊 **Progress indicators** para operações longas
- ✅ **Checkmarks** para operações concluídas
- ❌ **Símbolos de erro** para falhas

### Flexibilidade
- 🔧 **Opções de linha de comando**
- 🚀 **Modo desenvolvimento/produção**
- ⏭️ **Pular etapas específicas**
- 📖 **Ajuda integrada**

### Robustez
- 🛡️ **Tratamento de erros**
- 🔄 **Retry logic** para operações críticas
- 🧹 **Cleanup automático**
- 📝 **Logs detalhados**

---

**Criado em**: Janeiro 2025  
**Versão**: 1.0  
**Compatibilidade**: Windows (PowerShell), Linux/macOS (Bash)