#!/bin/bash

# 🎭 LifeCalling E2E Test Runner
echo "🎭 Iniciando testes E2E para LifeCalling"

# Verifica se as aplicações estão rodando
echo "🔍 Verificando se as aplicações estão rodando..."

# Verifica frontend (Next.js)
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend (Next.js) está rodando em http://localhost:3000"
else
    echo "❌ Frontend não está rodando. Execute: pnpm dev:web"
    exit 1
fi

# Verifica backend (FastAPI)
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Backend (FastAPI) está acessível"
else
    echo "⚠️  Backend pode não estar rodando. Execute: pnpm dev:api"
fi

echo ""
echo "🚀 Executando testes E2E..."

# Executa os testes
pnpm test:e2e

echo ""
echo "📊 Para ver o relatório: npx playwright show-report"
echo "🎮 Para modo debug: pnpm test:e2e:debug"
echo "👀 Para modo visual: pnpm test:e2e:ui"