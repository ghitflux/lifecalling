# Correções Pendentes - Bugs Críticos do Sistema

**Data**: 10/10/2025
**Status**: PARCIALMENTE COMPLETO

---

## ✅ Correções Aplicadas com Sucesso

### 1. ✅ Consultoria Líquida - Fallback Correto
**Arquivo**: `lifecalling/apps/web/src/app/casos/[id]/page.tsx` (linha ~749)

**APLICADO**:
```typescript
caseDetail.simulation.totals.custoConsultoriaLiquido ??
  (caseDetail.simulation.totals.custoConsultoria * 0.86)
```

**Resultado**: Agora quando `custoConsultoriaLiquido` não existe, calcula corretamente (consultoria * 0.86) ao invés de mostrar o valor bruto.

---

### 2. ✅ Cores e Contraste - AdminStatusChanger
**Arquivo**: `lifecalling/apps/web/src/components/case/AdminStatusChanger.tsx`

**APLICADO**:
- Linha 127: `bg-orange-100 border-orange-300` (antes: bg-orange-50)
- Linha 175: `bg-orange-100 border-orange-300` (modal)

**Resultado**: Melhor contraste visual (WCAG AA compliant).

---

## ❌ Correções NÃO Aplicadas (Hot Reload Interferiu)

### 3. ❌ CaseChat - Remover Filtro de Canal
**Arquivo**: `lifecalling/apps/web/src/components/case/CaseChat.tsx`

**APLICAR MANUALMENTE**:

**Linha 32-36** - TROCAR:
```typescript
const { data: comments = [], isLoading } = useQuery({
  queryKey: ['comments', caseId, defaultChannel],
  queryFn: () => getComments(caseId, defaultChannel),
  refetchInterval: 10000,
});
```

**POR**:
```typescript
const { data: comments = [], isLoading } = useQuery({
  queryKey: ['comments', caseId],
  queryFn: () => getComments(caseId), // SEM FILTRO - mostra TODOS os comentários
  refetchInterval: 10000,
});
```

---

### 4. ❌ CaseChat - Remover Scroll Automático
**Arquivo**: `lifecalling/apps/web/src/components/case/CaseChat.tsx`

**APLICAR MANUALMENTE**:

**Linhas 56-59** - DELETAR:
```typescript
// Scroll automático ao final quando novos comentários chegam
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [comments]);
```

**Linha 171** - DELETAR:
```typescript
<div ref={chatEndRef} />
```

**Linha 29** - DELETAR (se não for mais usado):
```typescript
const chatEndRef = useRef<HTMLDivElement>(null);
```

---

### 5. ❌ Remover Botão "Ver Financiamentos"
**Arquivo**: `lifecalling/apps/web/src/app/calculista/[caseId]/page.tsx`

**APLICAR MANUALMENTE**:

**Linha 17** - REMOVER `DollarSign` do import:
```typescript
// ANTES:
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw, DollarSign } from "lucide-react";

// DEPOIS:
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw } from "lucide-react";
```

**Linhas 415-425** - DELETAR:
```typescript
{/* Botão Ver Financiamentos */}
<div className="mt-4 pt-4 border-t">
  <Button
    variant="outline"
    className="w-full flex items-center justify-center gap-2"
    onClick={() => router.push(`/financeiro/${caseId}`)}
  >
    <DollarSign className="h-4 w-4" />
    Ver Financiamentos
  </Button>
</div>
```

---

## ⚠️ Problemas Ainda NÃO Investigados

###  6. ⚠️ Divergência de Status Entre Módulos

**Descrição**: Quando admin muda status de um caso (ex: "aguardando_calculista" → "retorno_fechamento"), o status muda mas aparece diferente em módulos diferentes:
- Atendimento mostra: "novo"
- Calculista mostra: "retorno_fechamento" (correto)

**Possível Causa**: Cache desatualizado ou problema de sincronização entre caso e simulação.

**Onde Investigar**:
1. Backend: `lifecalling/apps/api/app/routers/cases.py` (linha ~1530)
2. Frontend: invalidações de cache no AdminStatusChanger (linhas 71-77)
3. Queries de listagem de casos

**Ação Necessária**:
- Adicionar logs de debug
- Verificar se simulação.status está sendo atualizado junto com case.status
- Forçar refetch de queries após mudança de status

---

### 7. ⚠️ Página Rola para Baixo ao Abrir

**Descrição**: Ao abrir um caso no módulo de atendimento, a página automaticamente rola para o final (histórico).

**Possível Causa**: Algum `useEffect` ou `scrollIntoView` não identificado.

**Onde Investigar**:
- `lifecalling/apps/web/src/app/casos/[id]/page.tsx`
- Procurar por: `scroll`, `scrollTo`, `scrollIntoView`

**Ação Necessária**:
- Identificar qual `useEffect` está causando o scroll
- Remover ou condicionar o scroll apenas no primeiro load

---

### 8. ⚠️ Migrações Pendentes

**Status**: NÃO VERIFICADO (alembic não instalado no ambiente)

**Ação Necessária**:
```bash
cd lifecalling/apps/api
pip install alembic  # se necessário
python -m alembic current
python -m alembic upgrade head  # se houver migrações pendentes
```

---

## 📋 Checklist de Aplicação Manual

Para aplicar as correções pendentes, execute na ordem:

### Passo 1: Parar Processos
```bash
# Parar todos os processos Node/dev em execução
# CTRL+C nos terminais ou fechar VSCode
```

### Passo 2: Aplicar Correções no CaseChat
```bash
# Editar manualmente:
lifecalling/apps/web/src/components/case/CaseChat.tsx

# Aplicar mudanças das seções 3 e 4 acima
```

### Passo 3: Remover Botão Ver Financiamentos
```bash
# Editar manualmente:
lifecalling/apps/web/src/app/calculista/[caseId]/page.tsx

# Aplicar mudanças da seção 5 acima
```

### Passo 4: Rebuild
```bash
cd lifecalling/apps/web
pnpm build
```

### Passo 5: Testar
```bash
pnpm dev:turbo
```

### Passo 6: Investigar Problemas Restantes
- Divergência de status (seção 6)
- Scroll automático ao abrir página (seção 7)
- Migrações pendentes (seção 8)

---

## 📊 Status Final

| Item | Status | Prioridade |
|------|--------|------------|
| Consultoria Líquida (fallback) | ✅ APLICADO | Alta |
| Cores AdminStatusChanger | ✅ APLICADO | Média |
| Chat - Filtro de canal | ❌ PENDENTE | **CRÍTICA** |
| Chat - Scroll automático | ❌ PENDENTE | **CRÍTICA** |
| Botão Ver Financiamentos | ❌ PENDENTE | Média |
| Divergência de status | ⚠️  NÃO INVESTIGADO | **CRÍTICA** |
| Scroll ao abrir página | ⚠️  NÃO INVESTIGADO | Média |
| Migrações pendentes | ⚠️  NÃO VERIFICADO | Alta |

---

## 🚨 AÇÃO IMEDIATA NECESSÁRIA

**CRÍTICO - Aplicar agora**:
1. Correção #3: Chat sem filtro de canal
2. Correção #4: Chat sem scroll automático
3. Investigação #6: Divergência de status

**Pode esperar**:
4. Correção #5: Remover botão (não afeta funcionalidade)
5. Investigação #7: Scroll ao abrir (incômodo, não quebra sistema)

---

**Última atualização**: 10/10/2025
**Responsável**: Claude (Anthropic)
