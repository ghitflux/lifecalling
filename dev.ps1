# Lifecalling - Script de Desenvolvimento Otimizado
# Executa migrações e inicia servidores sem reinstalar dependências

param(
    [switch]$SkipMigrations,
    [switch]$StoryBook,
    [switch]$Help
)

if ($Help) {
    Write-Host "Lifecalling - Script de Desenvolvimento Otimizado" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uso: .\dev.ps1 [opções]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opções:" -ForegroundColor Yellow
    Write-Host "  -SkipMigrations    Pula execução das migrações"
    Write-Host "  -StoryBook         Inicia também o Storybook"
    Write-Host "  -Help              Mostra esta ajuda"
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1                      # Inicia com migrações"
    Write-Host "  .\dev.ps1 -SkipMigrations      # Pula migrações"
    Write-Host "  .\dev.ps1 -StoryBook           # Inclui Storybook"
    Write-Host ""
    Write-Host "URLs:" -ForegroundColor Cyan
    Write-Host "  • API:       http://localhost:8000"
    Write-Host "  • Web App:   http://localhost:3000"
    Write-Host "  • Storybook: http://localhost:6006"
    Write-Host "  • Docs:      http://localhost:8000/docs"
    exit 0
}

Write-Host "🚀 Iniciando Lifecalling (Modo Desenvolvimento)" -ForegroundColor Green
Write-Host ""

# Função para verificar se uma porta está em uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Função para liberar portas ocupadas
function Clear-Ports {
    Write-Host "🔍 Verificando portas..." -ForegroundColor Yellow

    $ports = @(3000, 8000)
    if ($StoryBook) { $ports += 6006 }

    foreach ($port in $ports) {
        if (Test-Port $port) {
            Write-Host "⚠️  Porta $port em uso, liberando..." -ForegroundColor Yellow

            # Encontra e mata processos usando a porta
            $processes = netstat -ano | Select-String ":$port " | ForEach-Object {
                $fields = $_.ToString().Split(' ', [StringSplitOptions]::RemoveEmptyEntries)
                if ($fields.Length -ge 5) { $fields[4] }
            } | Sort-Object -Unique

            foreach ($pid in $processes) {
                if ($pid -and $pid -ne "0") {
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "✅ Processo $pid finalizado" -ForegroundColor Green
                    } catch {
                        Write-Host "⚠️  Não foi possível finalizar processo $pid" -ForegroundColor Yellow
                    }
                }
            }

            Start-Sleep -Seconds 2
        }
    }
}

# Função para iniciar banco de dados
function Start-Database {
    Write-Host "🐘 Iniciando banco de dados..." -ForegroundColor Yellow

    try {
        # Verifica se o banco já está rodando
        $dbRunning = docker compose -f docker.compose.yml ps db --format json 2>$null | ConvertFrom-Json | Where-Object { $_.State -eq "running" }

        if ($dbRunning) {
            Write-Host "✅ Banco de dados já está rodando" -ForegroundColor Green
        } else {
            docker compose -f docker.compose.yml up -d db
            if ($LASTEXITCODE -ne 0) {
                throw "Falha ao iniciar banco de dados"
            }

            Write-Host "✅ Banco de dados iniciado" -ForegroundColor Green
            Write-Host "⏳ Aguardando banco ficar disponível..." -ForegroundColor Yellow
            Start-Sleep -Seconds 8
        }

    } catch {
        Write-Host "❌ Erro ao iniciar banco: $_" -ForegroundColor Red
        exit 1
    }
}

# Função para executar migrações
function Invoke-Migrations {
    if ($SkipMigrations) {
        Write-Host "⏭️  Pulando migrações" -ForegroundColor Yellow
        return
    }

    Write-Host "🔄 Executando migrações..." -ForegroundColor Yellow

    try {
        # Executa migrações via PowerShell
        powershell.exe -ExecutionPolicy Bypass -File ".\migrate.ps1"

        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao executar migrações"
        }

        Write-Host "✅ Migrações executadas" -ForegroundColor Green

    } catch {
        Write-Host "❌ Erro nas migrações: $_" -ForegroundColor Red
        exit 1
    }
}

# Função para iniciar API
function Start-API {
    Write-Host "⚡ Iniciando API (FastAPI)..." -ForegroundColor Yellow

    try {
        # Verifica se a API já está rodando
        $apiRunning = docker compose -f docker.compose.yml ps api --format json 2>$null | ConvertFrom-Json | Where-Object { $_.State -eq "running" }

        if ($apiRunning) {
            Write-Host "🔄 Reiniciando API..." -ForegroundColor Yellow
            docker compose -f docker.compose.yml restart api
        } else {
            docker compose -f docker.compose.yml up -d api
        }

        if ($LASTEXITCODE -ne 0) {
            throw "Falha ao iniciar API"
        }

        Write-Host "✅ API iniciada (http://localhost:8000)" -ForegroundColor Green

    } catch {
        Write-Host "❌ Erro ao iniciar API: $_" -ForegroundColor Red
        exit 1
    }
}

# Função para iniciar aplicação web
function Start-WebApp {
    Write-Host "🌐 Iniciando aplicação web (Next.js)..." -ForegroundColor Yellow

    try {
        # Inicia em nova janela do PowerShell
        $webProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\apps\trae\lifecallingv1\lifecalling\apps\web'; Write-Host '🌐 Next.js Dev Server' -ForegroundColor Green; pnpm dev" -PassThru

        if (-not $webProcess) {
            throw "Falha ao iniciar aplicação web"
        }

        Start-Sleep -Seconds 3
        Write-Host "✅ Web app iniciada (http://localhost:3000)" -ForegroundColor Green

    } catch {
        Write-Host "❌ Erro ao iniciar web app: $_" -ForegroundColor Red
        exit 1
    }
}

# Função para iniciar Storybook
function Start-Storybook {
    if (-not $StoryBook) { return }

    Write-Host "📚 Iniciando Storybook..." -ForegroundColor Yellow

    try {
        # Inicia em nova janela do PowerShell
        $storybookProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'D:\apps\trae\lifecallingv1\lifecalling\apps\web'; Write-Host '📚 Storybook Dev Server' -ForegroundColor Magenta; pnpm storybook" -PassThru

        if (-not $storybookProcess) {
            throw "Falha ao iniciar Storybook"
        }

        Start-Sleep -Seconds 3
        Write-Host "✅ Storybook iniciado (http://localhost:6006)" -ForegroundColor Green

    } catch {
        Write-Host "❌ Erro ao iniciar Storybook: $_" -ForegroundColor Red
        # Não falha, Storybook é opcional
    }
}

# Função para mostrar status final
function Show-Status {
    Write-Host ""
    Write-Host "🎉 Lifecalling iniciado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 URLs disponíveis:" -ForegroundColor Cyan
    Write-Host "  • API (FastAPI):    http://localhost:8000" -ForegroundColor White
    Write-Host "  • Docs (Swagger):   http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  • Web App (Next.js): http://localhost:3000" -ForegroundColor White
    if ($StoryBook) {
        Write-Host "  • Storybook:        http://localhost:6006" -ForegroundColor White
    }
    Write-Host ""
    Write-Host "🛠️  Comandos úteis:" -ForegroundColor Yellow
    Write-Host "  • Ver logs API:     docker compose -f docker.compose.yml logs api -f"
    Write-Host "  • Parar tudo:       docker compose -f docker.compose.yml stop"
    Write-Host "  • Reiniciar API:    docker compose -f docker.compose.yml restart api"
    Write-Host ""
    Write-Host "💡 Dica: Os dados do banco são preservados entre execuções" -ForegroundColor Green
    Write-Host "    Para reset completo, use: docker compose -f docker.compose.yml down -v" -ForegroundColor Gray
    Write-Host ""
}

# Execução principal
try {
    Clear-Ports
    Start-Database
    Invoke-Migrations
    Start-API
    Start-WebApp
    Start-Storybook
    Show-Status

    Write-Host "✋ Pressione qualquer tecla para parar os serviços..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} catch {
    Write-Host "❌ Erro durante inicialização: $_" -ForegroundColor Red
    exit 1
} finally {
    Write-Host ""
    Write-Host "⏹️  Parando serviços..." -ForegroundColor Yellow
    docker compose -f docker.compose.yml stop api
    Write-Host "Servicos parados (banco e dados preservados)" -ForegroundColor Green
}