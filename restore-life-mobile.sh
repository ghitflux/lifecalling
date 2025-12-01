#!/bin/bash
# Script para restaurar o módulo Life Mobile localmente
# Criado em: 2025-12-01

echo "🔄 Restaurando módulo Life Mobile..."

# 1. Descomentar módulo na Sidebar
SIDEBAR_PATH="apps/web/src/components/shell/Sidebar.tsx"
echo ""
echo "📝 Descomentando Life Mobile na Sidebar..."

if [ -f "$SIDEBAR_PATH" ]; then
    # Criar backup
    cp "$SIDEBAR_PATH" "$SIDEBAR_PATH.backup-$(date +%Y%m%d-%H%M%S)"

    # Usar sed para descomentar o bloco
    sed -i '
    /{ label: "Usuários"/ {
        :loop
        n
        s|^  // {$|  {|
        s|^  //   |    |
        s|^  // },|  },|
        /{ label: "FAQ"/!b loop
    }
    ' "$SIDEBAR_PATH"

    # Restaurar array expandedMenus
    sed -i 's/const \[expandedMenus, setExpandedMenus\] = useState<string\[\]>(\[\]);/const [expandedMenus, setExpandedMenus] = useState<string[]>(["Life Mobile"]);/' "$SIDEBAR_PATH"

    echo "   ✅ Sidebar.tsx atualizado"
else
    echo "   ❌ Arquivo Sidebar.tsx não encontrado"
fi

# 2. Renomear diretório _life-mobile de volta para life-mobile
LIFE_MOBILE_DISABLED="apps/web/src/app/_life-mobile"
LIFE_MOBILE_ENABLED="apps/web/src/app/life-mobile"

echo ""
echo "📁 Verificando diretório life-mobile..."

if [ -d "$LIFE_MOBILE_DISABLED" ]; then
    if [ -d "$LIFE_MOBILE_ENABLED" ]; then
        echo "   ⚠️  Diretório life-mobile já existe, removendo _life-mobile..."
        rm -rf "$LIFE_MOBILE_DISABLED"
    else
        mv "$LIFE_MOBILE_DISABLED" "$LIFE_MOBILE_ENABLED"
        echo "   ✅ Diretório renomeado: _life-mobile → life-mobile"
    fi
elif [ -d "$LIFE_MOBILE_ENABLED" ]; then
    echo "   ℹ️  Diretório life-mobile já está ativo"
else
    echo "   ⚠️  Nenhum diretório life-mobile encontrado"
fi

echo ""
echo "✅ Restauração concluída!"
echo "📌 Próximos passos:"
echo "   1. Verifique as alterações: git status"
echo "   2. Teste a aplicação localmente"
echo "   3. Commit se necessário: git add . && git commit -m 'Restaurar Life Mobile'"
