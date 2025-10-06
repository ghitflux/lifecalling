# 🚀 Lifecalling - Deploy VPS - Credenciais e Instruções

**Data do Deploy:** 06/10/2025 02:20 BRT
**Branch:** deploy
**Status:** ✅ OPERACIONAL (HTTP) | ⏳ HTTPS (aguardando DNS)

---

## 📋 Informações da VPS

| Item | Valor |
|------|-------|
| **Provedor** | Hostinger VPS |
| **IP Público** | `72.60.158.156` |
| **SSH User** | `root` |
| **SSH Password** | `LifeCalling@25` |
| **Diretório App** | `/opt/lifeservicos/src` |

---

## 🌐 Domínios Configurados

| Domínio | IP | Tipo | Status |
|---------|----|----- |--------|
| `lifeservicos.com` | `72.60.158.156` | A | ✅ Configurado |
| `www.lifeservicos.com` | `72.60.158.156` | A | ✅ Configurado |
| `api.lifeservicos.com` | `72.60.158.156` | A | ✅ Configurado |

**Propagação DNS:** ⏳ 6-24 horas (aguardando para Let's Encrypt)

---

## 🔑 Credenciais de Acesso ao Sistema

### Usuário Administrador

```
Email:    admin@lifecalling.com
Senha:    Admin@123
Role:     admin
Status:   ✅ ATIVO
```

**⚠️ IMPORTANTE:** Altere a senha após primeiro acesso!

---

## 🔗 URLs de Acesso

### Acesso Atual (HTTP)

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | `http://72.60.158.156` | ✅ Funcionando |
| **API Health** | `http://72.60.158.156:8000/health` | ✅ Funcionando |

### Acesso Futuro (HTTPS - após DNS propagar)

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | `https://lifeservicos.com` | ⏳ Aguardando DNS |
| **API** | `https://api.lifeservicos.com` | ⏳ Aguardando DNS |
| **API Health** | `https://api.lifeservicos.com/health` | ⏳ Aguardando DNS |

---

## 🐳 Containers Docker

| Container | Imagem | Status | Portas |
|-----------|--------|--------|--------|
| `src-db-1` | `postgres:16` | ✅ healthy | 5433:5432 |
| `src-api-1` | `src-api` (custom) | ✅ healthy | 8000 |
| `src-web-1` | `src-web` (custom) | ✅ healthy | 3000 |
| `src-proxy-1` | `caddy:2` | ✅ running | 80, 443 |
| `src-pgbackup-1` | `postgres-backup-local:16` | ✅ healthy | - |

---

## 🗄️ Banco de Dados PostgreSQL

| Item | Valor |
|------|-------|
| **Host** | `db` (interno) ou `72.60.158.156:5433` (externo) |
| **Database** | `lifecalling` |
| **User** | `lifecalling` |
| **Password** | `lifecalling` |
| **Tabelas** | 21 tabelas |
| **Usuários** | 1 (admin) |
| **Migrações** | `add_indexes_rankings` (head) |

### Conexão Externa

```bash
psql -h 72.60.158.156 -p 5433 -U lifecalling -d lifecalling
# Senha: lifecalling
```

### Conexão via SSH

```bash
ssh root@72.60.158.156
cd /opt/lifeservicos/src
docker compose -f docker-compose.prod.yml exec db psql -U lifecalling -d lifecalling
```

---

## 🔐 Secrets e Variáveis de Ambiente

**Arquivo:** `/opt/lifeservicos/src/.env`

**⚠️ NUNCA compartilhe ou commite este arquivo!**

### Principais Secrets

| Variável | Descrição | Gerado Automaticamente |
|----------|-----------|------------------------|
| `JWT_SECRET` | Secret para tokens JWT | ✅ 64 chars hex |
| `FASTAPI_SECRET_KEY` | Secret FastAPI | ✅ 64 chars hex |
| `CSRF_SECRET` | Secret CSRF tokens | ✅ 32 chars hex |

**Backup do .env:** Guardado em `/opt/lifeservicos/src/.env` (chmod 600)

---

## 💾 Sistema de Backups

### Configuração

| Item | Valor |
|------|-------|
| **Horário** | 03:00 BRT (diário) |
| **Retenção** | 7 dias + 4 semanas + 3 meses |
| **Diretório** | `/opt/lifeservicos/src/backups/pg/` |
| **Formato** | PostgreSQL custom (compressed) |
| **Compressão** | gzip -9 |

### Comandos Úteis

```bash
# Backup manual
ssh root@72.60.158.156
cd /opt/lifeservicos/src
docker compose -f docker-compose.prod.yml exec pgbackup backup

# Listar backups
ls -lh /opt/lifeservicos/src/backups/pg/

# Restaurar backup (exemplo)
docker compose -f docker-compose.prod.yml exec db \
  pg_restore -U lifecalling -d lifecalling -c /backups/arquivo.backup
```

---

## 🔧 Comandos de Gerenciamento

### SSH - Conectar na VPS

```bash
ssh root@72.60.158.156
# Senha: LifeCalling@25
```

### Docker Compose - Gerenciar Aplicação

```bash
# Ir para diretório da aplicação
cd /opt/lifeservicos/src

# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs de um container específico
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f proxy

# Restart de um container
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart web
docker compose -f docker-compose.prod.yml restart proxy

# Restart completo
docker compose -f docker-compose.prod.yml restart

# Parar todos os containers
docker compose -f docker-compose.prod.yml down

# Iniciar todos os containers
docker compose -f docker-compose.prod.yml up -d

# Rebuild e restart
docker compose -f docker-compose.prod.yml up -d --build
```

### Systemd - Auto-start no Boot

```bash
# Status do serviço
systemctl status lifeservicos

# Restart via systemd
systemctl restart lifeservicos

# Parar serviço
systemctl stop lifeservicos

# Iniciar serviço
systemctl start lifeservicos

# Ver logs do systemd
journalctl -u lifeservicos -f
```

### Git - Atualizar Código

```bash
cd /opt/lifeservicos/src

# Puxar atualizações do branch deploy
git pull origin deploy

# Rebuild e restart
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🛡️ Segurança

### Firewall (UFW)

```bash
# Ver regras ativas
ufw status

# Portas abertas
# - 22/tcp  (SSH)
# - 80/tcp  (HTTP)
# - 443/tcp (HTTPS)
```

### Cookies de Autenticação

| Cookie | HttpOnly | Secure | SameSite | Domain |
|--------|----------|--------|----------|---------|
| `access` | ✅ Sim | ✅ Sim (prod) | lax | `.lifeservicos.com` |
| `refresh` | ✅ Sim | ✅ Sim (prod) | lax | `.lifeservicos.com` |
| `csrf_token` | ❌ Não* | ✅ Sim (prod) | lax | `.lifeservicos.com` |
| `role` | ❌ Não | ✅ Sim (prod) | lax | `.lifeservicos.com` |

*CSRF token precisa ser lido pelo JavaScript para validação

---

## ⏳ Próximos Passos (HTTPS)

### Quando o DNS Propagar (6-24h)

1. **Verificar propagação DNS:**
   ```bash
   nslookup lifeservicos.com 8.8.8.8
   nslookup api.lifeservicos.com 8.8.8.8
   ```

2. **Restart do Caddy para obter certificados:**
   ```bash
   ssh root@72.60.158.156
   cd /opt/lifeservicos/src
   docker compose -f docker-compose.prod.yml restart proxy
   ```

3. **Aguardar 2-5 minutos e monitorar logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f proxy
   # Procurar por: "certificate obtained successfully"
   ```

4. **Verificar certificados emitidos:**
   ```bash
   docker exec src-proxy-1 caddy list-certificates
   ```

5. **Testar HTTPS:**
   ```bash
   curl -I https://lifeservicos.com
   curl https://api.lifeservicos.com/health
   ```

### Troubleshooting TLS

Se após 24h ainda não funcionar:

```bash
# Ver logs de erro do Caddy
docker compose -f docker-compose.prod.yml logs proxy | grep -i error

# Limpar cache de certificados e tentar novamente
docker compose -f docker-compose.prod.yml down
docker volume rm src_caddy_data src_caddy_config
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoramento

### Health Checks

```bash
# API Health
curl http://72.60.158.156:8000/health

# Frontend
curl -I http://72.60.158.156

# Containers
docker compose -f docker-compose.prod.yml ps
```

### Uso de Recursos

```bash
# Uso de CPU/RAM dos containers
docker stats

# Espaço em disco
df -h

# Logs de tamanho
du -sh /opt/lifeservicos/src/backups/pg/
```

---

## 🆘 Suporte e Troubleshooting

### Logs Importantes

```bash
# Logs da API (erros de autenticação, etc)
docker compose -f docker-compose.prod.yml logs api | grep ERROR

# Logs do Web (erros de build, etc)
docker compose -f docker-compose.prod.yml logs web | grep ERROR

# Logs do Proxy (erros TLS, etc)
docker compose -f docker-compose.prod.yml logs proxy | grep -i error

# Logs do PostgreSQL
docker compose -f docker-compose.prod.yml logs db | grep ERROR
```

### Problemas Comuns

#### Container não inicia

```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs <container_name>

# Rebuild forçado
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

#### Banco de dados com problemas

```bash
# Conectar e verificar
docker compose -f docker-compose.prod.yml exec db psql -U lifecalling -d lifecalling

# Rodar migrações novamente
docker compose -f docker-compose.prod.yml run --rm migrate
```

#### Login não funciona

```bash
# Verificar usuário no banco
docker compose -f docker-compose.prod.yml exec db psql -U lifecalling -d lifecalling \
  -c "SELECT id, email, role, active FROM users WHERE email='admin@lifecalling.com';"

# Ver logs da API
docker compose -f docker-compose.prod.yml logs api | grep -i "login\|auth"
```

---

## 📝 Notas Finais

1. **Backup do .env:** Guardado em `/opt/lifeservicos/src/.env` com chmod 600
2. **Secrets:** Gerados automaticamente durante deploy (JWT, CSRF, FastAPI)
3. **PostgreSQL:** Porta 5433 exposta externamente (mudar se não necessário)
4. **TLS/HTTPS:** Disponível automaticamente após DNS propagar
5. **Systemd:** Configurado para iniciar automaticamente no boot
6. **Backups:** Diários às 03:00, retenção de 7d+4w+3m

---

## 📞 Contato

**Deploy realizado por:** Claude Code
**Data:** 06/10/2025
**Repositório:** https://github.com/ghitflux/lifecalling (branch: deploy)

---

**✅ Deploy VPS Lifecalling - Completo e Operacional!**
