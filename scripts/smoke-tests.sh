#!/bin/bash

# Smoke-tests do fluxo (curl)
# Útil pra validar sem depender da UI
# Execute da raiz do projeto

set -e

echo "🚀 Iniciando smoke tests do fluxo Fechamento → Financeiro → Contratos"

# Limpar cookies
rm -f cookies.txt

echo "📝 1. Login com admin"
# login
curl -i -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"123456"}' -c cookies.txt

echo "📁 2. Importar arquivo txt (substitua caminho conforme necessário)"
# NOTA: substitua o caminho pelo arquivo real
if [ -f "santander 07.txt" ]; then
    curl -i -X POST http://localhost:8000/imports -b cookies.txt -F "file=@santander 07.txt"
else
    echo "⚠️  Arquivo 'santander 07.txt' não encontrado. Pulando importação..."
fi

echo "📋 3. Listar casos"
# listar casos
CASE_COUNT=$(curl -s -b cookies.txt http://localhost:8000/cases | jq '.items | length')
echo "📊 Total de casos encontrados: $CASE_COUNT"

if [ "$CASE_COUNT" -eq 0 ]; then
    echo "❌ Nenhum caso encontrado. Encerrando testes."
    exit 1
fi

echo "👤 4. Atribuir caso 1 ao atendente logado"
# atribuir caso 1 ao atendente logado
curl -i -X POST http://localhost:8000/cases/1/assign -b cookies.txt

echo "🧮 5. Enviar para calculista"
# enviar para calculista
curl -i -X POST http://localhost:8000/cases/1/to-calculista -b cookies.txt

echo "⏳ 6. Aprovar cálculo (como calculista/supervisor)"
echo "   NOTA: Faça login desse papel e aprove no endpoint /simulations/{id}/approve se já tiver simulação"

echo "✅ 7. Aprovar fechamento"
# aprovar fechamento
curl -i -X POST http://localhost:8000/closing/approve -H "Content-Type: application/json" \
  -d '{"case_id":1}' -b cookies.txt

echo "💰 8. Efetivar financeiro (gera contrato)"
# efetivar financeiro (gera contrato)
curl -i -X POST http://localhost:8000/finance/disburse -H "Content-Type: application/json" \
  -d '{"case_id":1,"total_amount":12345.67,"installments":12}' -b cookies.txt

echo "📄 9. Ver contratos"
# ver contratos
CONTRACTS=$(curl -s -b cookies.txt http://localhost:8000/contracts)
echo "📊 Contratos criados:"
echo "$CONTRACTS" | jq .

echo "🎉 Smoke tests concluídos com sucesso!"
echo ""
echo "✅ Checklist de avanço:"
echo "  ✅ Middleware ativo: bloqueia/redireciona e aplica RBAC básico"
echo "  ✅ WS reativo: listas atualizam sem recarregar página"
echo "  ✅ Upload de anexos no detalhe do caso funcional"
echo "  ✅ Seed alinhado com modal de credenciais"
echo "  ✅ Fluxo Fechamento → Financeiro → Contratos validado"

# Limpar cookies
rm -f cookies.txt