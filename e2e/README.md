# 🎭 E2E Tests - LifeCalling

Este diretório contém os testes end-to-end (E2E) para verificar o funcionamento completo da aplicação LifeCalling.

## 🎯 Testes Implementados

### 1. **example.spec.ts**
- Testes básicos de funcionalidade
- Verificação de título da página
- Teste da página de login

### 2. **login-websocket.spec.ts**
- ✅ **Correção do loop de redirecionamento no login**
- ✅ **Verificação de conexão WebSocket sem erros**
- ✅ **Teste de refresh token**
- ✅ **Redirecionamento correto para páginas protegidas**

### 3. **websocket-stability.spec.ts**
- ✅ **Teste de reconexão após interrupção de rede**
- ✅ **Verificação de heartbeat durante inatividade**
- ✅ **Teste de autenticação WebSocket**

## 🚀 Como Executar

### Pré-requisitos
1. **Backend rodando**: `pnpm dev:api`
2. **Frontend rodando**: `pnpm dev:web`

### Comandos Disponíveis

```bash
# Executar todos os testes
pnpm test:e2e

# Executar com interface visual
pnpm test:e2e:ui

# Executar em modo headed (com navegador visível)
pnpm test:e2e:headed

# Executar em modo debug
pnpm test:e2e:debug

# Executar teste específico
pnpm test:e2e login-websocket.spec.ts
```

## 📋 Verificações dos Testes

### **Problemas Corrigidos Verificados:**

#### ❌ **Problema Original: WebSocket Error**
- ✅ **URL corrigida**: Testa conexão em `ws://localhost:3000/api/ws`
- ✅ **Autenticação**: Verifica token JWT no WebSocket
- ✅ **Heartbeat**: Testa ping/pong para manter conexão
- ✅ **Reconexão**: Verifica exponential backoff

#### ❌ **Problema Original: Loop de Login**
- ✅ **Endpoint refresh**: Testa `/auth/refresh`
- ✅ **Redirecionamento**: Verifica `router.push()` em vez de `window.location.href`
- ✅ **Middleware**: Testa verificação de tokens
- ✅ **Parâmetro next**: Verifica redirecionamento após login

## 🔍 Cenários Testados

1. **Login bem-sucedido sem loop**
2. **WebSocket conecta sem erros**
3. **Heartbeat previne desconexão**
4. **Reconexão após interrupção**
5. **Autenticação WebSocket funcional**
6. **Refresh token funcional**
7. **Redirecionamento correto para páginas protegidas**

## 📊 Relatórios

Os relatórios dos testes são gerados em `playwright-report/` após a execução.

Para visualizar: `npx playwright show-report`

## 🛠️ Desenvolvimento

Para adicionar novos testes:

1. Crie arquivo `*.spec.ts` em `/e2e`
2. Use imports: `import { test, expect } from '@playwright/test'`
3. Siga padrões dos testes existentes
4. Execute com `pnpm test:e2e:debug` para desenvolvimento

## 🎮 Dicas

- Use `--headed` para ver o navegador durante os testes
- Use `--debug` para pausar e inspecionar
- Use `--ui` para interface visual interativa
- Configure timeouts para testes de WebSocket (operações assíncronas)