#!/bin/bash

# Script de inicialização do Lifecalling
# Executa migrações pendentes e inicia os servidores

set -e  # Para na primeira falha

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Variáveis
SKIP_MIGRATIONS=false
DEV_MODE=true

# Função de ajuda
show_help() {
    echo -e "${GREEN}Script de inicialização do Lifecalling${NC}"
    echo ""
    echo -e "${YELLOW}Uso: ./start.sh [opções]${NC}"
    echo ""
    echo -e "${YELLOW}Opções:${NC}"
    echo "  --skip-migrations    Pula a execução das migrações"
    echo "  --prod              Executa em modo produção"
    echo "  --help              Mostra esta ajuda"
    echo ""
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./start.sh                    # Executa com migrações em modo dev"
    echo "  ./start.sh --skip-migrations  # Pula migrações"
    echo "  ./start.sh --prod             # Executa em modo produção"
    exit 0
}

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --prod)
            DEV_MODE=false
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo -e "${RED}Opção desconhecida: $1${NC}"
            show_help
            ;;
    esac
done

echo -e "${GREEN}🚀 Iniciando Lifecalling...${NC}"
echo ""

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar dependências
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependências...${NC}"
    
    local missing=()
    
    if ! command_exists docker; then
        missing+=("Docker")
    fi
    
    if ! command_exists node; then
        missing+=("Node.js")
    fi
    
    if ! command_exists pnpm; then
        missing+=("pnpm")
    fi
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}❌ Dependências faltando: ${missing[*]}${NC}"
        echo -e "${RED}Por favor, instale as dependências antes de continuar.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Todas as dependências encontradas${NC}"
}

# Função para verificar arquivo .env
check_environment() {
    echo -e "${YELLOW}🔧 Verificando configuração...${NC}"
    
    if [ ! -f ".env" ]; then
        echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
        echo -e "${RED}Crie um arquivo .env baseado no exemplo.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"
}

# Função para iniciar serviços Docker
start_docker_services() {
    echo -e "${YELLOW}🐳 Iniciando serviços Docker...${NC}"
    
    if ! docker compose -f docker.compose.yml up -d db; then
        echo -e "${RED}❌ Erro ao iniciar serviços Docker${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Banco de dados iniciado${NC}"
    
    # Aguarda o banco estar pronto
    echo -e "${YELLOW}⏳ Aguardando banco de dados...${NC}"
    sleep 10
}

# Função para executar migrações
run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        echo -e "${YELLOW}⏭️ Pulando migrações (--skip-migrations)${NC}"
        return
    fi
    
    echo -e "${YELLOW}📊 Executando migrações...${NC}"
    
    # Verifica se o banco está disponível
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if docker compose -f docker.compose.yml exec -T db psql -U lifecalling -d lifecalling -c "SELECT 1;" >/dev/null 2>&1; then
            break
        fi
        echo -e "${YELLOW}⏳ Aguardando banco de dados... ($((retries + 1))/$max_retries)${NC}"
        sleep 2
        ((retries++))
    done
    
    if [ $retries -eq $max_retries ]; then
        echo -e "${RED}❌ Timeout aguardando banco de dados${NC}"
        exit 1
    fi
    
    # Executa as migrações
    cd apps/api
    if ! docker run --rm --network lifecalling_default \
        -v "$(pwd):/app" -w /app \
        --env-file "../../.env" \
        python:3.11-slim bash -c "pip install -r requirements.txt && alembic upgrade head"; then
        echo -e "${RED}❌ Erro ao executar migrações${NC}"
        cd ../..
        exit 1
    fi
    cd ../..
    
    echo -e "${GREEN}✅ Migrações executadas com sucesso${NC}"
}

# Função para instalar dependências
install_dependencies() {
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    
    if ! pnpm install; then
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
}

# Função para iniciar servidores
start_servers() {
    echo -e "${YELLOW}🌐 Iniciando servidores...${NC}"
    
    # Inicia API via Docker
    echo -e "${CYAN}🔧 Iniciando API (FastAPI)...${NC}"
    if ! docker compose -f docker.compose.yml up -d api; then
        echo -e "${RED}❌ Erro ao iniciar API${NC}"
        exit 1
    fi
    
    sleep 3
    
    # Inicia aplicação web
    echo -e "${CYAN}🌐 Iniciando aplicação web (Next.js)...${NC}"
    
    cd apps/web
    if [ "$DEV_MODE" = true ]; then
        pnpm dev &
    else
        pnpm build && pnpm start &
    fi
    WEB_PID=$!
    cd ../..
    
    echo -e "${GREEN}✅ Servidores iniciados!${NC}"
}

# Função para mostrar status
show_status() {
    echo ""
    echo -e "${GREEN}🎉 Lifecalling iniciado com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}📍 URLs disponíveis:${NC}"
    echo -e "  • API:            ${CYAN}http://localhost:8000${NC}"
    echo -e "  • Docs (Swagger): ${CYAN}http://localhost:8000/docs${NC}"
    echo -e "  • Web App:        ${CYAN}http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
    echo -e "  • Ver logs API:  ${GRAY}docker compose -f docker.compose.yml logs api -f${NC}"
    echo -e "  • Parar tudo:    ${GRAY}docker compose -f docker.compose.yml down${NC}"
    echo -e "  • Reset DB:      ${GRAY}docker compose -f docker.compose.yml down -v${NC}"
    echo ""
    echo -e "${YELLOW}Pressione Ctrl+C para parar os serviços.${NC}"
}

# Função para cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando serviços...${NC}"
    
    # Para o servidor web se estiver rodando
    if [ ! -z "$WEB_PID" ]; then
        kill $WEB_PID 2>/dev/null || true
    fi
    
    # Para os serviços Docker
    docker compose -f docker.compose.yml down
    
    echo -e "${GREEN}✅ Serviços parados${NC}"
    exit 0
}

# Configura trap para cleanup
trap cleanup SIGINT SIGTERM

# Execução principal
main() {
    check_dependencies
    check_environment
    start_docker_services
    install_dependencies
    run_migrations
    start_servers
    show_status
    
    # Mantém o script rodando
    while true; do
        sleep 1
    done
}

# Executa função principal
main "$@"