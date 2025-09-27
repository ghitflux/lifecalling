#!/bin/bash

# Script para executar migrações do Lifecalling
# Executa apenas as migrações do Alembic

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis padrão
ACTION="upgrade"
REVISION="head"

# Função de ajuda
show_help() {
    echo -e "${GREEN}Script de migrações do Lifecalling${NC}"
    echo ""
    echo -e "${YELLOW}Uso: ./migrate.sh [ação] [revisão]${NC}"
    echo ""
    echo -e "${YELLOW}Ações:${NC}"
    echo "  upgrade    Aplica migrações (padrão)"
    echo "  downgrade  Reverte migrações"
    echo "  current    Mostra revisão atual"
    echo "  history    Mostra histórico de migrações"
    echo "  heads      Mostra cabeças das migrações"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./migrate.sh                    # Aplica todas as migrações"
    echo "  ./migrate.sh upgrade head       # Aplica até a última migração"
    echo "  ./migrate.sh downgrade -1       # Reverte uma migração"
    echo "  ./migrate.sh current            # Mostra revisão atual"
    echo "  ./migrate.sh history            # Mostra histórico"
    exit 0
}

# Parse argumentos
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
fi

if [ ! -z "$1" ]; then
    ACTION="$1"
fi

if [ ! -z "$2" ]; then
    REVISION="$2"
fi

echo -e "${GREEN}📊 Executando migrações do Lifecalling...${NC}"
echo ""

# Verifica se Docker está rodando
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo -e "${RED}Por favor, inicie o Docker antes de continuar.${NC}"
    exit 1
fi

# Verifica se arquivo .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo -e "${RED}Crie um arquivo .env baseado no exemplo.${NC}"
    exit 1
fi

# Inicia o banco se não estiver rodando
echo -e "${YELLOW}🐳 Verificando banco de dados...${NC}"
if ! docker compose -f docker.compose.yml ps db --format json | grep -q '"State":"running"'; then
    echo -e "${YELLOW}🚀 Iniciando banco de dados...${NC}"
    docker compose -f docker.compose.yml up -d db
    echo -e "${YELLOW}⏳ Aguardando banco ficar disponível...${NC}"
    sleep 10
fi

# Executa a ação solicitada
echo -e "${CYAN}🔧 Executando: alembic $ACTION $REVISION${NC}"

cd apps/api

case "$ACTION" in
    "upgrade")
        docker run --rm --network lifecalling_default \
            -v "$(pwd):/app" -w /app \
            --env-file "../../.env" \
            python:3.11-slim bash -c "pip install -r requirements.txt && alembic upgrade $REVISION"
        ;;
    "downgrade")
        docker run --rm --network lifecalling_default \
            -v "$(pwd):/app" -w /app \
            --env-file "../../.env" \
            python:3.11-slim bash -c "pip install -r requirements.txt && alembic downgrade $REVISION"
        ;;
    "current")
        docker run --rm --network lifecalling_default \
            -v "$(pwd):/app" -w /app \
            --env-file "../../.env" \
            python:3.11-slim bash -c "pip install -r requirements.txt && alembic current"
        ;;
    "history")
        docker run --rm --network lifecalling_default \
            -v "$(pwd):/app" -w /app \
            --env-file "../../.env" \
            python:3.11-slim bash -c "pip install -r requirements.txt && alembic history"
        ;;
    "heads")
        docker run --rm --network lifecalling_default \
            -v "$(pwd):/app" -w /app \
            --env-file "../../.env" \
            python:3.11-slim bash -c "pip install -r requirements.txt && alembic heads"
        ;;
    *)
        echo -e "${RED}❌ Ação desconhecida: $ACTION${NC}"
        echo -e "${RED}Use ./migrate.sh --help para ver as opções disponíveis.${NC}"
        cd ../..
        exit 1
        ;;
esac

cd ../..

echo -e "${GREEN}✅ Migração executada com sucesso!${NC}"