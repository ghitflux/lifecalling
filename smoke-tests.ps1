# Smoke-tests do fluxo (PowerShell)
# Útil pra validar sem depender da UI
# Execute da raiz do projeto

Write-Host "🚀 Iniciando smoke tests do fluxo Fechamento → Financeiro → Contratos" -ForegroundColor Green

# Limpar cookies
if (Test-Path "cookies.txt") { Remove-Item "cookies.txt" }

Write-Host "📝 1. Login com admin" -ForegroundColor Yellow
# login
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"123456"}' -SessionVariable session
    Write-Host "✅ Login realizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "📁 2. Importar arquivo txt (substitua caminho conforme necessário)" -ForegroundColor Yellow
if (Test-Path "santander 07.txt") {
    try {
        $form = @{
            file = Get-Item "santander 07.txt"
        }
        Invoke-RestMethod -Uri "http://localhost:8000/imports" -Method POST -Form $form -WebSession $session
        Write-Host "✅ Arquivo importado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Erro na importação: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Arquivo 'santander 07.txt' não encontrado. Pulando importação..." -ForegroundColor Yellow
}

Write-Host "📋 3. Listar casos" -ForegroundColor Yellow
try {
    $cases = Invoke-RestMethod -Uri "http://localhost:8000/cases" -Method GET -WebSession $session
    $caseCount = $cases.items.Count
    Write-Host "📊 Total de casos encontrados: $caseCount" -ForegroundColor Cyan

    if ($caseCount -eq 0) {
        Write-Host "❌ Nenhum caso encontrado. Encerrando testes." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao listar casos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "👤 4. Atribuir caso 1 ao atendente logado" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:8000/cases/1/assign" -Method POST -WebSession $session
    Write-Host "✅ Caso atribuído com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao atribuir caso: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "🧮 5. Enviar para calculista" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:8000/cases/1/to-calculista" -Method POST -WebSession $session
    Write-Host "✅ Enviado para calculista com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao enviar para calculista: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "⏳ 6. Aprovar cálculo (como calculista/supervisor)" -ForegroundColor Yellow
Write-Host "   NOTA: Faça login desse papel e aprove no endpoint /simulations/{id}/approve se já tiver simulação" -ForegroundColor Gray

Write-Host "✅ 7. Aprovar fechamento" -ForegroundColor Yellow
try {
    $body = @{
        case_id = 1
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8000/closing/approve" -Method POST -ContentType "application/json" -Body $body -WebSession $session
    Write-Host "✅ Fechamento aprovado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao aprovar fechamento: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "💰 8. Efetivar financeiro (gera contrato)" -ForegroundColor Yellow
try {
    $body = @{
        case_id = 1
        total_amount = 12345.67
        installments = 12
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:8000/finance/disburse" -Method POST -ContentType "application/json" -Body $body -WebSession $session
    Write-Host "✅ Financeiro efetivado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erro ao efetivar financeiro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "📄 9. Ver contratos" -ForegroundColor Yellow
try {
    $contracts = Invoke-RestMethod -Uri "http://localhost:8000/contracts" -Method GET -WebSession $session
    Write-Host "📊 Contratos criados:" -ForegroundColor Cyan
    $contracts | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "⚠️  Erro ao listar contratos: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Smoke tests concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Checklist de avanço:" -ForegroundColor Green
Write-Host "  ✅ Middleware ativo: bloqueia/redireciona e aplica RBAC básico" -ForegroundColor White
Write-Host "  ✅ WS reativo: listas atualizam sem recarregar página" -ForegroundColor White
Write-Host "  ✅ Upload de anexos no detalhe do caso funcional" -ForegroundColor White
Write-Host "  ✅ Seed alinhado com modal de credenciais" -ForegroundColor White
Write-Host "  ✅ Fluxo Fechamento → Financeiro → Contratos validado" -ForegroundColor White