# Script de inicializacao do Lifecalling
# Executa migracoes pendentes e inicia os servidores

param(
    [switch]$SkipMigrations,
    [bool]$DevMode = $true,
    [switch]$Help
)

if ($Help) {
    Write-Host "Script de inicializacao do Lifecalling" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uso: .\start.ps1 [opcoes]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opcoes:" -ForegroundColor Yellow
    Write-Host "  -SkipMigrations    Pula a execucao das migracoes"
    Write-Host "  -DevMode           Executa em modo desenvolvimento (padrao: true)"
    Write-Host "  -Help              Mostra esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Yellow
    Write-Host "  .\start.ps1                    # Executa com migracoes em modo dev"
    Write-Host "  .\start.ps1 -SkipMigrations    # Pula migracoes"
    Write-Host "  .\start.ps1 -DevMode:`$false    # Executa em modo producao"
    exit 0
}

Write-Host "Iniciando Lifecalling..." -ForegroundColor Green
Write-Host ""

# Funcao para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Funcao para verificar dependencias
function Test-Dependencies {
    Write-Host "Verificando dependencias..." -ForegroundColor Yellow
    
    $dependencies = @("docker", "node", "pnpm")
    $missing = @()
    
    foreach ($dep in $dependencies) {
        if (-not (Test-Command $dep)) {
            $missing += $dep
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "Dependencias faltando: $($missing -join ', ')" -ForegroundColor Red
        Write-Host "Por favor, instale as dependencias antes de continuar." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Todas as dependencias encontradas" -ForegroundColor Green
}

# Funcao para verificar arquivo .env
function Test-EnvFile {
    Write-Host "Verificando configuracao..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env")) {
        Write-Host "Arquivo .env nao encontrado!" -ForegroundColor Red
        Write-Host "Crie um arquivo .env baseado no exemplo." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Arquivo .env encontrado" -ForegroundColor Green
}

# Funcao para iniciar servicos Docker
function Start-DockerServices {
    Write-Host "Iniciando servicos Docker..." -ForegroundColor Yellow
    
    try {
        docker compose -f docker.compose.yml up -d db
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao iniciar servicos Docker"
        }
        
        Write-Host "Banco de dados iniciado" -ForegroundColor Green
        
        Write-Host "Aguardando banco de dados..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
    } catch {
        Write-Host "Erro ao iniciar servicos Docker: $_" -ForegroundColor Red
        exit 1
    }
}

# Funcao para executar migracoes
function Invoke-Migrations {
    if ($SkipMigrations) {
        Write-Host "Pulando migracoes (--skip-migrations)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Executando migracoes..." -ForegroundColor Yellow
    
    try {
        # Executa migracoes via Docker
        docker compose -f docker.compose.yml exec -T db psql -U lifecalling -d lifecalling -c "SELECT 1;" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Aguardando banco de dados ficar disponivel..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        }
        
        # Executa as migracoes
        Set-Location "apps\api"
        docker run --rm --network lifecalling_default -v "${PWD}:/app" -w /app --env-file "../../.env" python:3.11-slim bash -c "pip install -r requirements.txt; alembic upgrade head"
        Set-Location "..\..\"
        
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao executar migracoes"
        }
        
        Write-Host "Migracoes executadas com sucesso" -ForegroundColor Green
        
    } catch {
        Write-Host "Erro ao executar migracoes: $_" -ForegroundColor Red
        Set-Location "..\..\"
        exit 1
    }
}

# Funcao para instalar dependencias
function Install-Dependencies {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    
    try {
        pnpm install
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao instalar dependencias"
        }
        
        Write-Host "Dependencias instaladas" -ForegroundColor Green
        
    } catch {
        Write-Host "Erro ao instalar dependencias: $_" -ForegroundColor Red
        exit 1
    }
}

# Funcao para iniciar servidores
function Start-Servers {
    Write-Host "Iniciando servidores..." -ForegroundColor Yellow
    
    try {
        # Inicia API via Docker Compose
        Write-Host "Iniciando API (FastAPI)..." -ForegroundColor Cyan
        docker compose -f docker.compose.yml up -d api
        
        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao iniciar API"
        }
        
        Start-Sleep -Seconds 5
        
        # Inicia aplicacao web
        Write-Host "Iniciando aplicacao web (Next.js)..." -ForegroundColor Cyan
        if ($DevMode) {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\web; pnpm dev"
        } else {
            Set-Location "apps\web"
            pnpm build
            if ($LASTEXITCODE -ne 0) {
                throw "Falha ao fazer build da aplicacao web"
            }
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps\web; pnpm start"
            Set-Location "..\..\"
        }
        
        Write-Host "Servidores iniciados!" -ForegroundColor Green
        
    } catch {
        Write-Host "Erro ao iniciar servidores: $_" -ForegroundColor Red
        exit 1
    }
}

# Funcao para mostrar status
function Show-Status {
    Write-Host ""
    Write-Host "Lifecalling iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs disponiveis:" -ForegroundColor Yellow
    Write-Host "  • API:          http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  • Docs (Swagger): http://localhost:8000/docs" -ForegroundColor Cyan
    Write-Host "  • Web App:      http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos uteis:" -ForegroundColor Yellow
    Write-Host "  • Ver logs API:  docker compose -f docker.compose.yml logs api -f" -ForegroundColor Gray
    Write-Host "  • Parar tudo:    docker compose -f docker.compose.yml down" -ForegroundColor Gray
    Write-Host "  • Reset DB:      docker compose -f docker.compose.yml down -v" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar os servicos." -ForegroundColor Yellow
}

# Execucao principal
try {
    Test-Dependencies
    Test-EnvFile
    Start-DockerServices
    Install-Dependencies
    Invoke-Migrations
    Start-Servers
    Show-Status
    
    # Mantem o script rodando
    Write-Host "Pressione qualquer tecla para parar os servicos..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host "Erro durante a inicializacao: $_" -ForegroundColor Red
    exit 1
} finally {
    Write-Host ""
    Write-Host "Parando servicos..." -ForegroundColor Yellow
    docker compose -f docker.compose.yml down
    Write-Host "Servicos parados" -ForegroundColor Green
}