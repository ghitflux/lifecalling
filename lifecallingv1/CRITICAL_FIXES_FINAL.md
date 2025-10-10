# Correções Críticas Finais - Aplicação Manual Obrigatória

**IMPORTANTE**: O hot reload está impedindo a aplicação automática. Aplicar MANUALMENTE após parar todos os processos.

---

## PASSO 1: Parar TODOS os processos

```bash
# Fechar todos os terminais com pnpm dev/build
# OU
# CTRL+C em todos os processos Node.js rodando
# OU
# Fechar VSCode completamente
```

---

## CORREÇÃO #1: CaseChat - Remover Filtro de Canal e Scroll

**Arquivo**: `lifecalling/apps/web/src/components/case/CaseChat.tsx`

### Mudança 1.1: Import (linha 7)
```typescript
// ANTES:
import { useState, useEffect, useRef } from 'react';

// DEPOIS:
import { useState } from 'react';
```

### Mudança 1.2: Remover ref (linha 29)
```typescript
// DELETAR ESTA LINHA:
const chatEndRef = useRef<HTMLDivElement>(null);
```

### Mudança 1.3: Query sem filtro (linhas 31-36)
```typescript
// ANTES:
const { data: comments = [], isLoading } = useQuery({
  queryKey: ['comments', caseId, defaultChannel],
  queryFn: () => getComments(caseId, defaultChannel),
  refetchInterval: 10000,
});

// DEPOIS:
const { data: comments = [], isLoading } = useQuery({
  queryKey: ['comments', caseId],
  queryFn: () => getComments(caseId), // SEM filtro - mostra TODOS os comentários
  refetchInterval: 10000,
});
```

### Mudança 1.4: Deletar useEffect do scroll (linhas 56-59)
```typescript
// DELETAR TODO ESTE BLOCO:
// Scroll automático ao final quando novos comentários chegam
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [comments]);
```

### Mudança 1.5: Header do Chat (linha 111)
```typescript
// ANTES:
<h3 className="text-lg font-semibold">Chat - {defaultChannel}</h3>
{getChannelBadge(defaultChannel)}

// DEPOIS:
<h3 className="text-lg font-semibold">Chat do Caso</h3>
<Badge variant="outline" className="text-xs">Todos os comentários</Badge>
```

### Mudança 1.6: Mostrar canal em cada mensagem (linha 157)
```typescript
// ADICIONAR após a linha com {comment.role}:
<Badge variant="outline" className="text-xs">
  {comment.role}
</Badge>
{getChannelBadge(comment.channel)}  // <-- ADICIONAR ESTA LINHA
```

---

## CORREÇÃO #2: Remover Botão Ver Financiamentos

**Arquivo**: `lifecalling/apps/web/src/app/calculista/[caseId]/page.tsx`

### Mudança 2.1: Import (linha 17)
```typescript
// ANTES:
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw, DollarSign } from "lucide-react";

// DEPOIS:
import { ArrowLeft, Calculator, CheckCircle, XCircle, History, Download, FileText, Paperclip, Printer, RefreshCw } from "lucide-react";
```

### Mudança 2.2: Deletar botão (linhas 415-425)
```typescript
// DELETAR TODO ESTE BLOCO:
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

## CORREÇÃO #3: Investigar e Corrigir Divergência de Status

**Problema**: Quando admin muda status, fica diferente entre módulos.

### Passo 3.1: Verificar endpoint de mudança de status
**Arquivo**: `lifecalling/apps/api/app/routers/cases.py` (linha ~1530)

Código atual parece correto. Adicionar log de debug:

```python
# Após linha 1530 (case.status = data.new_status):
case.status = data.new_status
case.last_update_at = datetime.utcnow()

# ADICIONAR LOG:
print(f"[DEBUG] Status changed: Case {case_id} -> {data.new_status}")

# Verificar se há simulação vinculada
from ..models import Simulation
sim = db.query(Simulation).filter(Simulation.case_id == case_id).first()
if sim:
    print(f"[DEBUG] Simulação vinculada: ID {sim.id}, status atual: {sim.status}")
    # POSSÍVEL PROBLEMA: Simulação tem status próprio?
```

### Passo 3.2: Forçar atualização de simulação junto com caso

**ADICIONAR** após linha 1531:

```python
# Atualizar status da simulação também (se existir)
from ..models import Simulation
sim = db.query(Simulation).filter(Simulation.case_id == case_id).order_by(Simulation.id.desc()).first()
if sim:
    # Mapear status do caso para status da simulação
    status_map = {
        "calculista_pendente": "draft",
        "aprovado": "approved",
        "retorno_fechamento": "approved",
        "fechamento_aprovado": "approved",
        "financeiro_pendente": "approved",
    }
    if data.new_status in status_map:
        sim.status = status_map[data.new_status]
        print(f"[DEBUG] Simulação {sim.id} status atualizado para: {sim.status}")
```

---

## CORREÇÃO #4: Remover Scroll Automático ao Abrir Página

**Arquivo**: `lifecalling/apps/web/src/app/casos/[id]/page.tsx`

### Passo 4.1: Procurar useEffect com scroll
Verificar linhas 240-260 para identificar qual useEffect está causando scroll.

### Passo 4.2: Adicionar condição
Se encontrar algo como:

```typescript
useEffect(() => {
  // algum código que causa scroll
}, [caseDetail]);
```

ALTERAR para apenas rodar uma vez:

```typescript
useEffect(() => {
  // algum código que causa scroll
}, []); // <-- Array vazio = roda apenas uma vez no mount
```

OU DELETAR completamente se não for necessário.

---

## CORREÇÃO #5: Verificar Migrações Pendentes

```bash
cd lifecalling/apps/api

# Verificar se alembic está instalado
python -m alembic --version

# Se não estiver:
pip install alembic

# Verificar status
python -m alembic current

# Ver migrações pendentes
python -m alembic heads
python -m alembic history

# Aplicar migrações pendentes (se houver)
python -m alembic upgrade head
```

---

## ORDEM DE APLICAÇÃO

1. **PARAR TODOS OS PROCESSOS**
2. Aplicar Correção #1 (CaseChat)
3. Aplicar Correção #2 (Remover botão)
4. Aplicar Correção #3 (Status backend)
5. Aplicar Correção #4 (Scroll página)
6. Aplicar Correção #5 (Migrações)
7. **REBUILD E TESTAR**

```bash
cd lifecalling/apps/web
pnpm build
pnpm dev:turbo
```

---

## CHECKLIST DE VALIDAÇÃO

Após aplicar todas as correções, testar:

- [ ] Comentários aparecem em TODOS os módulos (atendente, calculista, fechamento)
- [ ] Ao enviar comentário, página NÃO rola para baixo
- [ ] Consultoria Líquida mostra valor correto (86% da consultoria)
- [ ] Botão "Ver Financiamentos" NÃO aparece no calculista
- [ ] Ao mudar status como admin, caso atualiza corretamente em todos os módulos
- [ ] Ao abrir caso no atendimento, página NÃO rola automaticamente
- [ ] Cores têm bom contraste (AdminStatusChanger)
- [ ] Migrações aplicadas sem erros

---

**PRIORIDADE MÁXIMA**:
1. Correção #1 (Chat) - CRÍTICO
2. Correção #3 (Status) - CRÍTICO
3. Correção #5 (Migrações) - ALTO
4. Correção #2 (Botão) - MÉDIO
5. Correção #4 (Scroll) - MÉDIO

---

**Última atualização**: 10/10/2025 03:00
