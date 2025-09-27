# Script para executar migrações do Lifecalling
# Executa apenas as migrações do Alembic

param(
    [string]$Action = "upgrade",
    [string]$Revision = "head",
    [switch]$Help
)

# Função de ajuda
function Show-Help {
    Write-Host "Script de migracoes do Lifecalling" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uso: .\migrate.ps1 [-Action <acao>] [-Revision <revisao>] [-Help]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Acoes:" -ForegroundColor Yellow
    Write-Host "  upgrade    Aplica migracoes (padrao)"
    Write-Host "  downgrade  Reverte migracoes"
    Write-Host "  current    Mostra revisao atual"
    Write-Host "  history    Mostra historico de migracoes"
    Write-Host "  heads      Mostra cabecas das migracoes"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Yellow
    Write-Host "  .\migrate.ps1                           # Aplica todas as migracoes"
    Write-Host "  .\migrate.ps1 -Action upgrade -Revision head  # Aplica ate a ultima migracao"
    Write-Host "  .\migrate.ps1 -Action downgrade -Revision -1  # Reverte uma migracao"
    Write-Host "  .\migrate.ps1 -Action current            # Mostra revisao atual"
    Write-Host "  .\migrate.ps1 -Action history            # Mostra historico"
    exit 0
}

if ($Help) {
    Show-Help
}

Write-Host "Executando migracoes do Lifecalling..." -ForegroundColor Green
Write-Host ""

# Verifica se Docker está rodando
try {
    docker info | Out-Null
} catch {
    Write-Host "Erro: Docker nao esta rodando!" -ForegroundColor Red
    Write-Host "Por favor inicie o Docker antes de continuar." -ForegroundColor Red
    exit 1
}

# Verifica se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "Erro: Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host "Crie um arquivo .env baseado no exemplo." -ForegroundColor Red
    exit 1
}

# Inicia o banco se não estiver rodando
Write-Host "Verificando banco de dados..." -ForegroundColor Yellow
try {
    $dbStatus = docker compose -f docker.compose.yml ps db --format json 2>$null | ConvertFrom-Json
    if (-not $dbStatus -or $dbStatus.State -ne "running") {
        Write-Host "Iniciando banco de dados..." -ForegroundColor Yellow
        docker compose -f docker.compose.yml up -d db
        Write-Host "Aguardando banco ficar disponivel..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
} catch {
    Write-Host "Iniciando banco de dados..." -ForegroundColor Yellow
    docker compose -f docker.compose.yml up -d db
    Write-Host "Aguardando banco ficar disponivel..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Executa a ação solicitada
Write-Host "Executando: alembic $Action $Revision" -ForegroundColor Cyan

try {
    Set-Location "apps\api"
    
    switch ($Action.ToLower()) {
        "upgrade" {
            docker run --rm --network lifecalling_default `
                -v "${PWD}:/app" -w /app `
                --env-file "../../.env" `
                python:3.11-slim bash -c "pip install -r requirements.txt && alembic upgrade $Revision"
        }
        "downgrade" {
            docker run --rm --network lifecalling_default `
                -v "${PWD}:/app" -w /app `
                --env-file "../../.env" `
                python:3.11-slim bash -c "pip install -r requirements.txt && alembic downgrade $Revision"
        }
        "current" {
            docker run --rm --network lifecalling_default `
                -v "${PWD}:/app" -w /app `
                --env-file "../../.env" `
                python:3.11-slim bash -c "pip install -r requirements.txt && alembic current"
        }
        "history" {
            docker run --rm --network lifecalling_default `
                -v "${PWD}:/app" -w /app `
                --env-file "../../.env" `
                python:3.11-slim bash -c "pip install -r requirements.txt && alembic history"
        }
        "heads" {
            docker run --rm --network lifecalling_default `
                -v "${PWD}:/app" -w /app `
                --env-file "../../.env" `
                python:3.11-slim bash -c "pip install -r requirements.txt && alembic heads"
        }
        default {
            Write-Host "Erro: Acao desconhecida: $Action" -ForegroundColor Red
            Write-Host "Use .\migrate.ps1 -Help para ver as opcoes disponiveis." -ForegroundColor Red
            exit 1
        }
    }
    
    Set-Location "..\..\"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migracao executada com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Erro ao executar migracao!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "Erro ao executar migracao: $_" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}