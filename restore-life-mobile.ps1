# Script para restaurar o módulo Life Mobile localmente
# Criado em: 2025-12-01

Write-Host "🔄 Restaurando módulo Life Mobile..." -ForegroundColor Cyan

# 1. Descomentar módulo na Sidebar
$sidebarPath = "apps\web\src\components\shell\Sidebar.tsx"
Write-Host "`n📝 Descomentando Life Mobile na Sidebar..."

if (Test-Path $sidebarPath) {
    $content = Get-Content $sidebarPath -Raw

    # Descomentar o bloco Life Mobile usando regex
    $content = $content -replace '(?s)  // \{\s+//   label: "Life Mobile",.*?//   \}\s+//,', @'
  {
    label: "Life Mobile",
    href: "/life-mobile",
    icon: Smartphone,
    roles: ["admin", "supervisor", "atendente"],
    subItems: [
      { label: "Dashboard", href: "/life-mobile" },
      { label: "Clientes", href: "/life-mobile/clientes" },
      { label: "Simulações", href: "/life-mobile/simulacoes" }
    ]
  },
'@

    # Restaurar array expandedMenus
    $content = $content -replace '\[expandedMenus, setExpandedMenus\] = useState<string\[\]>\(\[\]\);', '[expandedMenus, setExpandedMenus] = useState<string[]>(["Life Mobile"]);'

    Set-Content $sidebarPath -Value $content -NoNewline
    Write-Host "   ✅ Sidebar.tsx atualizado" -ForegroundColor Green
} else {
    Write-Host "   ❌ Arquivo Sidebar.tsx não encontrado" -ForegroundColor Red
}

# 2. Renomear diretório _life-mobile de volta para life-mobile
$lifeMobileDisabled = "apps\web\src\app\_life-mobile"
$lifeMobileEnabled = "apps\web\src\app\life-mobile"

Write-Host "`n📁 Verificando diretório life-mobile..."

if (Test-Path $lifeMobileDisabled) {
    if (Test-Path $lifeMobileEnabled) {
        Write-Host "   ⚠️  Diretório life-mobile já existe, removendo _life-mobile..." -ForegroundColor Yellow
        Remove-Item $lifeMobileDisabled -Recurse -Force
    } else {
        Rename-Item $lifeMobileDisabled $lifeMobileEnabled
        Write-Host "   ✅ Diretório renomeado: _life-mobile → life-mobile" -ForegroundColor Green
    }
} elseif (Test-Path $lifeMobileEnabled) {
    Write-Host "   ℹ️  Diretório life-mobile já está ativo" -ForegroundColor Blue
} else {
    Write-Host "   ⚠️  Nenhum diretório life-mobile encontrado" -ForegroundColor Yellow
}

Write-Host "`n✅ Restauração concluída!" -ForegroundColor Green
Write-Host "📌 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Verifique as alterações: git status"
Write-Host "   2. Teste a aplicação localmente"
Write-Host "   3. Commit se necessário: git add . && git commit -m 'Restaurar Life Mobile'"
