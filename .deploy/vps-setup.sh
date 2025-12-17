#!/bin/bash
set -euo pipefail

# VPS Lifecalling - Script de Deploy Automatizado
# Hostinger VPS: 72.60.158.156
# Repositório: https://github.com/ghitflux/lifecalling (branch: deploy)

echo "========================================="
echo "  Lifecalling VPS Deploy Setup"
echo "========================================="
echo ""

# ============================================
# 1) PREPARAR SISTEMA
# ============================================
echo "[1/7] Preparando sistema (Docker, UFW, diretórios)..."

apt update && apt -y upgrade
apt -y install ca-certificates curl gnupg ufw git

# Instalar Docker
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    . /etc/os-release
    cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $VERSION_CODENAME stable
EOF

    apt update
    apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
    echo "Docker já instalado."
fi

# Configurar firewall
echo "Configurando firewall UFW..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Parar serviços conflitantes
echo "Parando Apache2/Nginx se existirem..."
systemctl stop apache2 2>/dev/null || true
systemctl disable apache2 2>/dev/null || true
systemctl stop nginx 2>/dev/null || true
systemctl disable nginx 2>/dev/null || true

# Criar diretórios
echo "Criando estrutura de diretórios..."
mkdir -p /opt/lifeservicos/{proxy,backups/pg}

# ============================================
# 2) CLONAR REPOSITÓRIO
# ============================================
echo ""
echo "[2/7] Clonando repositório (branch: deploy)..."

REPO_URL="https://github.com/ghitflux/lifecalling"
BRANCH="deploy"

if [ -d "/opt/lifeservicos/src" ]; then
    echo "Removendo clone anterior..."
    rm -rf /opt/lifeservicos/src
fi

git clone -b "$BRANCH" "$REPO_URL" /opt/lifeservicos/src
cd /opt/lifeservicos/src

# ============================================
# 3) GERAR SECRETS E CRIAR .ENV
# ============================================
echo ""
echo "[3/7] Gerando secrets e configurando ambiente..."

JWT_SECRET=$(openssl rand -hex 32)
FASTAPI_SECRET_KEY=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 16)

cat > /opt/lifeservicos/src/.env <<EOF
# ===== POSTGRESQL DATABASE =====
DB_HOST=db
DB_PORT=5432
DB_NAME=lifecalling
DB_USER=lifecalling
DB_PASSWORD=lifecalling
DATABASE_URL=postgresql+psycopg2://lifecalling:lifecalling@db:5432/lifecalling

# ===== POSTGRES LEGACY (compatibility) =====
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=lifecalling
POSTGRES_USER=lifecalling
POSTGRES_PASSWORD=lifecalling

# ===== JWT CONFIGURATION =====
JWT_SECRET=${JWT_SECRET}
JWT_ISS=lifecalling
JWT_ACCESS_TTL_SECONDS=3600
JWT_REFRESH_TTL_SECONDS=86400

# ===== FASTAPI SECURITY =====
FASTAPI_SECRET_KEY=${FASTAPI_SECRET_KEY}
CSRF_SECRET=${CSRF_SECRET}

# ===== ENVIRONMENT =====
ENV=production
COOKIE_DOMAIN=.lifeservicos.com
FRONTEND_URL=https://lifeservicos.com,https://www.lifeservicos.com

# ===== NEXT.JS FRONTEND =====
NEXT_PUBLIC_API_BASE_URL=https://api.lifeservicos.com
NODE_ENV=production

# ===== UPLOADS =====
UPLOAD_DIR=/app/uploads

# ===== BACKUPS =====
TZ=America/Sao_Paulo
PG_BACKUP_CRON=0 3 * * *
PG_BACKUP_KEEP_DAYS=7
PG_BACKUP_KEEP_WEEKS=4
PG_BACKUP_KEEP_MONTHS=3
EOF

chmod 600 /opt/lifeservicos/src/.env
echo "✅ Arquivo .env criado com secrets gerados"

# ============================================
# 4) BUILD E UP DOS CONTAINERS
# ============================================
echo ""
echo "[4/7] Construindo e iniciando containers..."

cd /opt/lifeservicos/src
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# ============================================
# 5) AGUARDAR SERVIÇOS FICAREM PRONTOS
# ============================================
echo ""
echo "[5/7] Aguardando serviços ficarem prontos..."

echo "Aguardando API (pode levar 1-2 minutos)..."
timeout 120 bash -c 'until curl -sf http://localhost:8000/health > /dev/null 2>&1; do sleep 2; done' || true

echo "Aguardando Web (pode levar 1-2 minutos)..."
timeout 120 bash -c 'until curl -sf http://localhost:3000 > /dev/null 2>&1; do sleep 2; done' || true

echo "Aguardando provisionamento TLS Caddy (pode levar 2-3 minutos)..."
sleep 30

# ============================================
# 6) VALIDAÇÃO
# ============================================
echo ""
echo "[6/7] Validando deploy..."

echo "Status dos containers:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "Logs do Caddy (primeiras 50 linhas):"
docker compose -f docker-compose.prod.yml logs proxy | head -50

echo ""
echo "Testando endpoints:"
echo "- API Health: $(curl -sI http://localhost:8000/health | head -1)"
echo "- Web: $(curl -sI http://localhost:3000 | head -1)"

# ============================================
# 7) CONFIGURAR SYSTEMD AUTO-START
# ============================================
echo ""
echo "[7/7] Configurando systemd para auto-start..."

cat > /etc/systemd/system/lifeservicos.service <<'SYSTEMD_EOF'
[Unit]
Description=Lifeservicos Stack (docker compose)
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/lifeservicos/src
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
RemainAfterExit=yes
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

systemctl daemon-reload
systemctl enable lifeservicos
systemctl start lifeservicos

echo ""
echo "========================================="
echo "  ✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "========================================="
echo ""
echo "URLs de acesso:"
echo "  - Frontend: https://lifeservicos.com"
echo "  - API: https://api.lifeservicos.com"
echo ""
echo "Comandos úteis:"
echo "  - Ver logs: cd /opt/lifeservicos/src && docker compose -f docker-compose.prod.yml logs -f"
echo "  - Status: docker compose -f docker-compose.prod.yml ps"
echo "  - Restart: systemctl restart lifeservicos"
echo "  - Backups: ls -lh /opt/lifeservicos/src/backups/pg"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "  1. Testar login em https://lifeservicos.com"
echo "  2. Configurar DNS para apontar para este IP (72.60.158.156)"
echo "  3. Aguardar propagação DNS (~15 minutos)"
echo "  4. Verificar certificados SSL no Caddy"
echo ""
