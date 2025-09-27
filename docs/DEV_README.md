# Lifecalling - Scripts de Desenvolvimento

Scripts otimizados para desenvolvimento que **não reinstalam dependências** a cada execução e **preservam dados do banco**.

## 🚀 Scripts Disponíveis

### PowerShell (Windows)
```powershell
# Iniciar desenvolvimento completo
.\dev.ps1

# Pular migrações (mais rápido)
.\dev.ps1 -SkipMigrations

# Incluir Storybook
.\dev.ps1 -StoryBook

# Ajuda
.\dev.ps1 -Help
```

### Python (Multiplataforma)
```bash
# Iniciar desenvolvimento completo
python dev.py

# Pular migrações (mais rápido)
python dev.py --skip-migrations

# Incluir Storybook
python dev.py --storybook

# Ajuda
python dev.py --help
```

## 📱 URLs dos Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **API** | http://localhost:8000 | FastAPI backend |
| **Web App** | http://localhost:3000 | Next.js frontend |
| **Docs** | http://localhost:8000/docs | Swagger API docs |
| **Storybook** | http://localhost:6006 | Componentes UI |

## ✨ Funcionalidades

### ✅ **Otimizações**
- ❌ **Não reinstala** dependências (pnpm install) a cada execução
- 🔄 **Reutiliza** containers Docker existentes
- 📦 **Preserva dados** do banco entre execuções
- ⚡ **Libera portas** automaticamente em caso de conflito
- 🚀 **Execução mais rápida** para desenvolvimento

### 🛠️ **O que os scripts fazem:**
1. **Liberam portas** ocupadas (3000, 8000, 6006)
2. **Iniciam banco** PostgreSQL (ou reutilizam existente)
3. **Executam migrações** pendentes (opcional)
4. **Iniciam API** FastAPI via Docker
5. **Iniciam Web App** Next.js em nova janela
6. **Iniciam Storybook** (se solicitado) em nova janela

## 🗄️ **Persistência de Dados**

### Banco de Dados
- **Volume persistente:** `db_data`
- **Localização:** `/var/lib/postgresql/data`
- **Comportamento:** Dados preservados entre execuções

### Como resetar dados:
```bash
# Parar e remover apenas containers (preserva dados)
docker compose -f docker.compose.yml down

# Parar e remover containers + dados (reset completo)
docker compose -f docker.compose.yml down -v
```

## 🔧 **Comandos Úteis**

```bash
# Ver logs da API
docker compose -f docker.compose.yml logs api -f

# Reiniciar apenas a API
docker compose -f docker.compose.yml restart api

# Status dos containers
docker compose -f docker.compose.yml ps

# Parar todos os serviços (dados preservados)
docker compose -f docker.compose.yml stop

# Executar migrações manualmente
powershell.exe -ExecutionPolicy Bypass -File ".\migrate.ps1"
```

## 🚨 **Requisitos**

- **Docker** e **Docker Compose**
- **Node.js** e **pnpm**
- **PowerShell** (Windows) ou **Python 3.6+** (multiplataforma)
- **Arquivo .env** configurado

## 💡 **Dicas**

- **Primeira execução:** Pode demorar mais (build de imagens)
- **Execuções seguintes:** Muito mais rápidas
- **Desenvolvimento ativo:** Use `-SkipMigrations` para velocidade
- **Teste de componentes:** Use `-StoryBook` para UI
- **Problemas de porta:** Scripts resolvem automaticamente

## 🐛 **Troubleshooting**

### Porta em uso
- Scripts liberam automaticamente
- Se persistir: `netstat -ano | findstr ":3000"`

### Banco não conecta
- Aguarde 8-10 segundos após iniciar
- Verifique: `docker compose -f docker.compose.yml logs db`

### API não responde
- Reinicie: `docker compose -f docker.compose.yml restart api`
- Logs: `docker compose -f docker.compose.yml logs api -f`

---

**Desenvolvido para otimizar o fluxo de desenvolvimento do Lifecalling** 🚀