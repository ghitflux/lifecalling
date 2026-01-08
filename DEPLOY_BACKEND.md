# Deploy Life System Backend - Guia Completo

## 📋 Informações do Sistema

### Arquitetura Atual
- **Backend**: FastAPI + Python 3.11
- **Frontend**: Next.js 15.5.9 + Turbopack
- **Database**: PostgreSQL 16
- **Container**: Docker Compose
- **API Port**: 8000
- **Web Port**: 3000
- **DB Port**: 5433

### Branches
- **Backend + Web**: `branch-lifes-system`
- **Último commit**: e0de120

## 🚀 Deploy em Produção

### 1. Preparar Servidor

#### Requisitos do Servidor
- Ubuntu 20.04+ ou Debian 11+
- Docker 24+ e Docker Compose V2
- 2GB RAM mínimo (4GB recomendado)
- 20GB disco disponível
- Portas 80, 443, 8000 abertas

#### Instalar Dependências

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose V2
sudo apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 2. Clonar Repositório

```bash
# SSH (recomendado)
git clone git@github.com:ghitflux/lifeservicos.git
cd lifeservicos

# Ou HTTPS
git clone https://github.com/ghitflux/lifeservicos.git
cd lifeservicos

# Checkout branch correto
git checkout branch-lifes-system
git pull origin branch-lifes-system
```

### 3. Configurar Variáveis de Ambiente

#### Backend (.env na raiz)

```bash
cp .env.example .env
nano .env
```

```bash
# PostgreSQL Database
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=lifecalling
POSTGRES_USER=lifecalling
POSTGRES_PASSWORD=<SENHA_FORTE_AQUI>

# JWT Configuration
JWT_SECRET=<GERAR_SECRET_FORTE_256_BITS>
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=86400
JWT_ISS=lifecalling

# API URLs - PRODUÇÃO
NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com
API_BASE_URL=http://api:8000
FRONTEND_URL=https://lifeservicos.com,https://www.lifeservicos.com
COOKIE_DOMAIN=lifeservicos.com

# Upload Directory
UPLOAD_DIR=/app/uploads

# Environment
DEBUG=false
ENVIRONMENT=production
```

#### Frontend Web (.env.local)

```bash
cd apps/web
cp .env.local.example .env.local
nano .env.local
```

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com
NEXT_PUBLIC_API_URL=https://api.lifeservicos.com
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 4. Gerar Secrets Seguros

```bash
# JWT Secret (256 bits)
openssl rand -hex 32

# PostgreSQL Password
openssl rand -base64 32
```

### 5. Build e Deploy com Docker

#### Production Docker Compose

```bash
# Usar docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d --build

# Verificar containers
docker compose -f docker-compose.prod.yml ps

# Verificar logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

#### Estrutura docker-compose.prod.yml

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    restart: always
    depends_on:
      db:
        condition: service_healthy
    environment:
      - POSTGRES_HOST=db
    ports:
      - "8000:8000"
    volumes:
      - uploads:/app/uploads

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - api
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com

volumes:
  postgres_data:
  uploads:
```

### 6. Configurar Nginx Reverse Proxy

#### Instalar Nginx

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

#### Configuração do Site

```bash
sudo nano /etc/nginx/sites-available/lifeservicos
```

```nginx
# API Backend
server {
    server_name api.lifeservicos.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header Access-Control-Allow-Origin $http_origin always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Tenant" always;
        add_header Access-Control-Allow-Credentials true always;
    }

    listen 80;
}

# Frontend Web
server {
    server_name lifeservicos.com www.lifeservicos.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 80;
}
```

#### Ativar Site

```bash
sudo ln -s /etc/nginx/sites-available/lifeservicos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configurar SSL (HTTPS)

```bash
# Certbot para SSL gratuito (Let's Encrypt)
sudo certbot --nginx -d lifeservicos.com -d www.lifeservicos.com
sudo certbot --nginx -d api.lifeservicos.com

# Renovação automática
sudo certbot renew --dry-run
```

### 8. Migrations e Dados Iniciais

```bash
# Entrar no container da API
docker compose -f docker-compose.prod.yml exec api bash

# Rodar migrations
alembic upgrade head

# Criar usuário admin
python -c "from app.db import SessionLocal; from app.models import User; from app.utils.security import hash_password; db = SessionLocal(); admin = User(email='admin@lifeservicos.com', hashed_password=hash_password('SENHA_ADMIN_FORTE'), name='Admin', role='super_admin', is_active=True); db.add(admin); db.commit(); print('Admin criado!')"

# Sair
exit
```

### 9. Backup Automatizado

#### Script de Backup

```bash
sudo nano /usr/local/bin/backup-lifeservicos.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backup/lifeservicos"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker compose -f /path/to/docker-compose.prod.yml exec -T db pg_dump -U lifecalling lifecalling > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/lib/docker/volumes/lifeservicos_uploads

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
```

#### Agendar com Cron

```bash
sudo chmod +x /usr/local/bin/backup-lifeservicos.sh
sudo crontab -e

# Adicionar linha (backup diário às 3h)
0 3 * * * /usr/local/bin/backup-lifeservicos.sh >> /var/log/backup-lifeservicos.log 2>&1
```

### 10. Monitoramento

#### Logs em Tempo Real

```bash
# Todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Apenas API
docker compose -f docker-compose.prod.yml logs -f api

# Apenas Web
docker compose -f docker-compose.prod.yml logs -f web

# Apenas DB
docker compose -f docker-compose.prod.yml logs -f db
```

#### Health Checks

```bash
# API
curl https://api.lifeservicos.com/docs

# Web
curl https://lifeservicos.com

# Database (dentro do container)
docker compose exec db pg_isready -U lifecalling
```

### 11. Atualizações (Deploy Futuro)

```bash
# 1. Pull das mudanças
cd /path/to/lifeservicos
git pull origin branch-lifes-system

# 2. Rebuild containers
docker compose -f docker-compose.prod.yml up -d --build

# 3. Rodar migrations (se houver)
docker compose -f docker-compose.prod.yml exec api alembic upgrade head

# 4. Verificar saúde
docker compose -f docker-compose.prod.yml ps
```

## 📊 Monitoramento e Alertas

### Instalar Portainer (Opcional)

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: http://seu-servidor:9000

## 🔒 Segurança

### Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Docker Security

```bash
# Limitar recursos do container
# Adicionar em docker-compose.prod.yml:
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

## 📝 Checklist de Deploy

- [ ] Servidor configurado (Docker, Docker Compose)
- [ ] Repositório clonado e branch correto (branch-lifes-system)
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Secrets gerados (JWT, DB password)
- [ ] Docker Compose rodando (docker-compose.prod.yml)
- [ ] Nginx configurado
- [ ] SSL/HTTPS ativo (certbot)
- [ ] Migrations executadas
- [ ] Usuário admin criado
- [ ] Backup automatizado configurado
- [ ] Firewall configurado (UFW)
- [ ] Monitoramento ativo
- [ ] Testes funcionais completos
- [ ] DNS apontando para servidor (lifeservicos.com, api.lifeservicos.com)

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web

# Verificar configurações
docker compose -f docker-compose.prod.yml config
```

### Erro de conexão com DB

```bash
# Verificar saúde do DB
docker compose exec db pg_isready

# Verificar variáveis
docker compose exec api env | grep POSTGRES
```

### Nginx 502 Bad Gateway

```bash
# Verificar se containers estão rodando
docker compose ps

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t
```

## 📞 Suporte

Em caso de problemas críticos:
1. Verificar logs dos containers
2. Verificar saúde do database
3. Testar endpoints da API diretamente
4. Revisar este documento
5. Contactar equipe DevOps

---

**Última atualização**: 2026-01-08
**Branch**: branch-lifes-system
**Commit**: e0de120
**Ambiente**: Produção
