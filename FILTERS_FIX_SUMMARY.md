# Correção dos Filtros da Esteira de Atendimentos

## Problemas Identificados

1. **Falta de debounce na busca**: A busca estava fazendo requisições a cada caractere digitado
2. **Query keys incorretas**: As query keys não estavam sendo atualizadas corretamente
3. **Lógica de filtros problemática**: Os filtros não estavam sendo aplicados corretamente
4. **Reset de página manual**: A página estava sendo resetada manualmente em vários lugares
5. **Falta de logs para debug**: Não havia logs para identificar problemas

## Correções Implementadas

### 1. Hook de Debounce
- **Arquivo**: `lifecalling/apps/web/src/hooks/useDebounce.ts`
- **Implementação**: Hook customizado para debounce de 500ms
- **Benefício**: Reduz requisições desnecessárias durante a digitação

### 2. Melhorias no Frontend
- **Arquivo**: `lifecalling/apps/web/src/app/esteira/page.tsx`
- **Correções**:
  - Adicionado debounce para `globalSearchTerm` e `mySearchTerm`
  - Atualizadas query keys para usar termos com debounce
  - Implementados useEffects para reset automático da página
  - Removidos resets manuais de página dos handlers
  - Adicionados logs para debug

### 3. Melhorias no Backend
- **Arquivo**: `lifecalling/apps/api/app/routers/cases.py`
- **Correções**:
  - Adicionados logs detalhados para debug
  - Melhorada lógica de filtros
  - Logs para identificar problemas de RBAC

- **Arquivo**: `lifecalling/apps/api/app/routers/clients.py`
- **Correções**:
  - Adicionados logs para debug da API de filtros

### 4. Script de Teste
- **Arquivo**: `lifecalling/test_filters.py`
- **Funcionalidade**: Script para testar todas as funcionalidades de filtros

## Como Testar

1. **Iniciar os serviços**:
   ```bash
   # Terminal 1 - Backend
   cd lifecalling/apps/api
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

   # Terminal 2 - Frontend
   cd lifecalling/apps/web
   npm run dev
   ```

2. **Executar script de teste**:
   ```bash
   cd lifecalling
   python test_filters.py
   ```

3. **Testar manualmente**:
   - Acessar a esteira de atendimentos
   - Testar filtros por banco
   - Testar filtros por status (admin/supervisor)
   - Testar busca por nome/CPF
   - Verificar logs no console do navegador e terminal do backend

## Logs de Debug

### Frontend (Console do Navegador)
- `Global query params:` - Parâmetros enviados para API global
- `Global response:` - Resposta da API global
- `My query params:` - Parâmetros enviados para API "meus casos"
- `My response:` - Resposta da API "meus casos"

### Backend (Terminal)
- `DEBUG: list_cases called with params:` - Parâmetros recebidos
- `DEBUG: Applying RBAC rules:` - Regras de permissão aplicadas
- `DEBUG: Applying status filter:` - Filtros de status aplicados
- `DEBUG: Applying entity filter:` - Filtros de entidade aplicados
- `DEBUG: Applying search filter:` - Filtros de busca aplicados
- `DEBUG: Total cases found:` - Total de casos encontrados

## Comportamento Esperado

### Filtros Globais (Admin/Supervisor)
- **Sem filtros**: Mostra apenas casos não atribuídos (`assigned=0`)
- **Com filtro de status**: Mostra TODOS os casos naquele status
- **Com filtro de banco**: Mostra casos daquele banco
- **Com busca**: Mostra casos que correspondem à busca

### Filtros Globais (Atendente)
- **Sempre**: Mostra apenas casos disponíveis (`assigned=0`) de qualquer status
- **Com filtro de banco**: Mostra casos disponíveis daquele banco
- **Com busca**: Mostra casos disponíveis que correspondem à busca

**CORREÇÃO CRÍTICA**: Removido o filtro forçado `status=novo` para atendentes, permitindo que vejam casos disponíveis de todos os status ao usar filtros de banco.

### Meus Atendimentos
- **Sem filtros**: Mostra todos os casos atribuídos ao usuário
- **Com filtro de status**: Mostra casos atribuídos naquele status
- **Com busca**: Mostra casos atribuídos que correspondem à busca

## Próximos Passos

1. **Remover logs de debug** após confirmar que tudo está funcionando
2. **Otimizar queries** se necessário
3. **Adicionar testes automatizados** para os filtros
4. **Implementar cache** para melhorar performance
