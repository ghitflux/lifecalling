# Correção dos Filtros para Atendentes

## Alterações Implementadas

### 1. Remoção dos Filtros Rápidos por Banco para Atendentes

**Antes**: Atendentes viam filtros rápidos por banco
**Depois**: Atendentes NÃO veem filtros rápidos por banco

**Código alterado**:
```typescript
// ANTES:
{filtersData?.bancos && filtersData.bancos.length > 0 && (

// DEPOIS:
{isAdminOrSupervisor && filtersData?.bancos && filtersData.bancos.length > 0 && (
```

### 2. Filtro de Banco Aplicado Apenas para Admin/Supervisor

**Antes**: Todos os usuários podiam filtrar por banco
**Depois**: Apenas admin/supervisor podem filtrar por banco

**Código alterado**:
```typescript
// ANTES:
if (globalSelectedBanco) {
  params.append("entity", globalSelectedBanco);
}

// DEPOIS:
if (isAdminOrSupervisor && globalSelectedBanco) {
  params.append("entity", globalSelectedBanco);
}
```

### 3. Query Key Otimizada

**Antes**: Query key sempre incluía `globalSelectedBanco`
**Depois**: Query key inclui `globalSelectedBanco` apenas para admin/supervisor

**Código alterado**:
```typescript
// ANTES:
queryKey: ["cases", "global", globalPage, globalPageSize, globalSelectedBanco, globalSelectedStatus, debouncedGlobalSearchTerm]

// DEPOIS:
queryKey: [
  "cases", 
  "global", 
  globalPage, 
  globalPageSize, 
  ...(isAdminOrSupervisor ? [globalSelectedBanco] : []), 
  globalSelectedStatus, 
  debouncedGlobalSearchTerm
]
```

### 4. Debounce Otimizado

**Antes**: Debounce de 500ms
**Depois**: Debounce de 300ms (mais responsivo)

## Comportamento Final

### Para Atendentes:
- ✅ **Campo de busca**: Funciona normalmente (nome/CPF)
- ✅ **Sem filtros de banco**: Não aparecem os filtros rápidos por banco
- ✅ **Casos disponíveis**: Vê apenas casos não atribuídos (`assigned=0`)
- ✅ **Busca rápida**: Debounce de 300ms para melhor responsividade

### Para Admin/Supervisor:
- ✅ **Filtros de banco**: Funcionam normalmente
- ✅ **Filtros de status**: Funcionam normalmente
- ✅ **Campo de busca**: Funciona normalmente
- ✅ **Controle total**: Podem ver todos os casos

## Arquivos Modificados

1. `lifecalling/apps/web/src/app/esteira/page.tsx`
   - Removido filtros de banco para atendentes
   - Otimizada query key
   - Reduzido debounce para 300ms

## Teste das Correções

### Para Atendentes:
1. Acesse a esteira de atendimentos
2. Verifique que NÃO aparecem filtros rápidos por banco
3. Digite um nome ou CPF no campo de busca
4. Verifique que os resultados aparecem em ~300ms

### Para Admin/Supervisor:
1. Acesse a esteira de atendimentos
2. Verifique que aparecem filtros rápidos por banco
3. Teste filtros por banco e status
4. Teste busca por nome/CPF

## Status

**✅ CONCLUÍDO** - Filtros corrigidos conforme solicitado.
