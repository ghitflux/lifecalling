# Script para iniciar o frontend
Write-Host "Iniciando frontend..." -ForegroundColor Green

# Navegar para o diretório do frontend
Set-Location "D:\apps\trae\lifecallingv1\lifecalling\apps\web"

# Verificar se node_modules existe
if (Test-Path "node_modules") {
    Write-Host "node_modules encontrado" -ForegroundColor Green
} else {
    Write-Host "node_modules não encontrado, instalando..." -ForegroundColor Yellow
    npm install
}

# Verificar se next está disponível
if (Test-Path "node_modules\.bin\next.CMD") {
    Write-Host "Next.js encontrado" -ForegroundColor Green
} else {
    Write-Host "Next.js não encontrado" -ForegroundColor Red
}

# Tentar iniciar o servidor
Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Green
try {
    npx next dev --port 3000
} catch {
    Write-Host "Erro ao iniciar: $($_.Exception.Message)" -ForegroundColor Red
}

