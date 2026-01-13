# Life Serviços - Guia de Deploy v1.0.2

## 📦 Estrutura do Projeto

```
D:\apps\lifeservicos\
├── life-system/          # Backend (FastAPI) + Frontend Web (Next.js)
│   ├── apps/
│   │   ├── api/         # Backend FastAPI (porta 8000)
│   │   └── web/         # Frontend Next.js (porta 3000)
│   ├── DEPLOY_BACKEND.md
│   └── branch: branch-lifes-system
│
├── life-mobile/          # App Mobile (React Native + Expo)
│   ├── app/             # Screens do app
│   ├── assets/          # Imagens e recursos
│   ├── DEPLOY_V1.0.2.md
│   └── branch: life-mobile
│
└── DEPLOY_GUIDE.md      # Este arquivo
```

## 🚀 Quick Start - Desenvolvimento Local

### 1. Backend + Web (life-system)

```bash
# Iniciar Docker (PostgreSQL + API)
cd D:\apps\lifeservicos\life-system
docker compose up -d

# Iniciar Web via pnpm (recomendado)
cd apps\web
pnpm run dev

# Acessar:
# - API Docs: http://localhost:8000/docs
# - Web: http://localhost:3000
```

### 2. Mobile (life-mobile)

```bash
# Iniciar Expo
cd D:\apps\lifeservicos\life-mobile
pnpm start

# Ou direto no Android
pnpm android

# Configurar .env para development:
EXPO_PUBLIC_API_URL="http://192.168.3.14:8000"
```

## 📋 Status Atual (08/01/2026)

### ✅ Commits Realizados

#### life-system
- **Branch**: `branch-lifes-system`
- **Commit**: `e0de120`
- **Mensagem**: "chore: Update IP configuration and component adjustments"
- **Mudanças**:
  - Ajustes em SimulationFormMultiBank
  - Atualização de IPs para 192.168.3.14

#### life-mobile
- **Branch**: `life-mobile`
- **Commit**: `c082ccf`
- **Mensagem**: "feat: Update login screen design and history display"
- **Mudanças**:
  - Nova tela de login com background moderno
  - Logo Life Digital centralizado
  - Histórico exibindo valor líquido liberado (net_amount)
  - Tagline em destaque
  - Botão "Criar Conta" transparente

### 🎯 Versão Alvo: 1.0.2

## 📚 Documentação de Deploy

### Para Mobile (v1.0.2)
📄 **Arquivo**: `life-mobile/DEPLOY_V1.0.2.md`

**Inclui**:
- ✅ Checklist completo de deploy
- ✅ Atualização de versão no app.json
- ✅ Configuração para API de produção
- ✅ Build AAB/APK com EAS
- ✅ Upload para Play Store
- ✅ Testes e validação
- ✅ Rollback em caso de problemas

**Próximos Passos Mobile**:
1. Atualizar versão em `app.json` (1.0.2, versionCode: 3)
2. Configurar `.env` para produção (https://api.lifeservicos.com)
3. Testar com API de produção
4. Build AAB: `eas build --platform android --profile production`
5. Upload para Play Store

### Para Backend + Web
📄 **Arquivo**: `life-system/DEPLOY_BACKEND.md`

**Inclui**:
- ✅ Configuração de servidor (Ubuntu/Debian)
- ✅ Docker Compose para produção
- ✅ Nginx reverse proxy
- ✅ SSL/HTTPS com Let's Encrypt
- ✅ Migrations e setup inicial
- ✅ Backup automatizado
- ✅ Monitoramento e logs
- ✅ Segurança (firewall, fail2ban)

**Próximos Passos Backend**:
1. Preparar servidor de produção
2. Configurar DNS (lifeservicos.com, api.lifeservicos.com)
3. Clonar repositório no servidor
4. Configurar variáveis de ambiente (.env)
5. Deploy com Docker Compose
6. Configurar Nginx + SSL

## 🔑 Configurações Importantes

### IPs Atuais (Desenvolvimento)
```
API Backend: http://192.168.3.14:8000
Web Frontend: http://192.168.3.14:3000
Database: localhost:5433 (PostgreSQL)
```

### URLs de Produção (Futuro)
```
API Backend: https://api.lifeservicos.com
Web Frontend: https://lifeservicos.com
Mobile API: https://api.lifeservicos.com
```

## 📱 Versões do App Mobile

| Versão | Version Code | Status | Data | Mudanças |
|--------|--------------|--------|------|----------|
| 1.0.0 | 1 | ✅ Publicado | - | Versão inicial |
| 1.0.1 | 2 | ✅ Publicado | - | Correções |
| **1.0.2** | **3** | 🚧 **Preparando** | **08/01/2026** | **Nova tela login + histórico** |

## 🔄 Workflow de Atualização

### Mobile App
```
1. Fazer mudanças → 2. Commit → 3. Push → 4. Atualizar versão →
5. Build AAB → 6. Testar → 7. Upload Play Store → 8. Aguardar aprovação
```

### Backend + Web
```
1. Fazer mudanças → 2. Commit → 3. Push → 4. Pull no servidor →
5. Docker rebuild → 6. Migrations → 7. Verificar saúde
```

## 🛠️ Ferramentas Necessárias

### Desenvolvimento
- ✅ Node.js 20+
- ✅ pnpm 9+
- ✅ Docker Desktop
- ✅ Git
- ✅ VS Code
- ✅ Android Studio (para mobile)

### Produção
- ✅ Servidor Ubuntu/Debian
- ✅ Docker + Docker Compose
- ✅ Nginx
- ✅ Certbot (SSL)
- ✅ EAS CLI (mobile builds)

## 📞 Links Úteis

### Repositórios
- Backend + Web: https://github.com/ghitflux/lifeservicos (branch: branch-lifes-system)
- Mobile: https://github.com/ghitflux/lifeservicos (branch: life-mobile)

### Documentação
- FastAPI Docs: http://localhost:8000/docs
- Expo: https://docs.expo.dev
- Next.js: https://nextjs.org/docs
- Docker: https://docs.docker.com

### Serviços
- Play Console: https://play.google.com/console
- Expo Dashboard: https://expo.dev
- GitHub: https://github.com/ghitflux/lifeservicos

## ⚠️ Avisos Importantes

### Segurança
- ❌ **NUNCA** commitar arquivos `.env`
- ❌ **NUNCA** commitar `release.keystore`
- ❌ **NUNCA** expor senhas ou tokens
- ✅ **SEMPRE** usar variáveis de ambiente
- ✅ **SEMPRE** fazer backup do keystore

### Git
- ✅ Branches separados: `branch-lifes-system` (backend+web), `life-mobile` (mobile)
- ✅ Commits descritivos com co-author Claude
- ✅ Push após cada feature completa

### Docker
- ✅ Docker Desktop deve estar rodando para backend
- ✅ PostgreSQL na porta 5433 (produção: 5432 interno)
- ✅ Containers: life-system-api-1, life-system-db-1

## 📊 Checklist Geral de Deploy

### Preparação
- [ ] Código commitado e pushado
- [ ] Documentação atualizada
- [ ] Testes locais passando
- [ ] Variáveis de ambiente configuradas

### Mobile v1.0.2
- [ ] Versão atualizada (app.json)
- [ ] API de produção configurada (.env)
- [ ] Imagens verificadas (login.png, life-logo.png)
- [ ] Build AAB gerado
- [ ] Testes em dispositivo real
- [ ] Upload para Play Store

### Backend + Web
- [ ] Servidor preparado
- [ ] DNS configurado
- [ ] Docker Compose rodando
- [ ] Nginx + SSL ativo
- [ ] Migrations executadas
- [ ] Backup configurado
- [ ] Monitoramento ativo

## 🎯 Próxima Ação Imediata

Para fazer o deploy da versão 1.0.2 do mobile:

1. **Ler**: `life-mobile/DEPLOY_V1.0.2.md`
2. **Atualizar**: `app.json` (versão 1.0.2, versionCode 3)
3. **Configurar**: `.env` para produção
4. **Testar**: App com API de produção
5. **Build**: `eas build --platform android --profile production`
6. **Upload**: Play Store Console

---

**Última atualização**: 2026-01-08
**Preparado por**: Claude Sonnet 4.5
**Status**: ✅ Pronto para deploy v1.0.2
