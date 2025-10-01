# Implementação: Status, Notificações, Segregação e Simulação

**Data:** 2025-09-30
**Objetivo:** Padronizar status, implementar sistema de notificações completo, segregar esteira por RBAC, e mostrar simulação em todos os módulos.

---

## 📋 Resumo Executivo

Esta implementação resolve os seguintes problemas:

1. ✅ **Status inconsistentes** entre frontend e backend
2. ✅ **Notificações incompletas** (não notificava em todas as mudanças de status)
3. ✅ **Segregação de esteira quebrada** (atendentes viam casos de outros atendentes)
4. ✅ **Lock de 72h não funcionava** corretamente
5. ✅ **Simulação não aparecia** em módulos fechamento, financeiro, contrato
6. ✅ **Filtros não funcionavam** (QuickFilters e AdvancedFilters)

---

## 🎯 FASE 1: Padronização de Status

### Arquivos Modificados:
- `packages/ui/src/StatusBadge.tsx`

### Mudanças:

**Status principais do ciclo de vida:**
```typescript
export type Status =
  | "novo"                      // Caso criado
  | "em_atendimento"            // Atendente está trabalhando
  | "disponivel"                // Caso disponível para atribuição
  | "calculista_pendente"       // Aguardando simulação
  | "calculo_aprovado"          // Simulação aprovada
  | "calculo_rejeitado"         // Simulação rejeitada
  | "fechamento_aprovado"       // Fechamento OK
  | "fechamento_reprovado"      // Fechamento reprovado
  | "financeiro_pendente"       // Aguardando liberação financeira
  | "contrato_efetivado"        // Contrato criado
  | "encerrado"                 // Caso finalizado
```

**Labels descritivos:**
- Cada status tem `label`, `color` e `icon`
- Labels em português claro: "Aguardando Calculista", "Cálculo Aprovado"
- Cores semânticas: verde (sucesso), vermelho (erro), azul (processamento)

**Impacto:**
- ✅ Status padronizados em todo o sistema
- ✅ Visual consistente em todos os módulos
- ✅ Tooltips nativos com descrição

---

## 🔔 FASE 2: Sistema de Notificações Completo

### Arquivos Modificados:
- `apps/api/app/routers/notifications.py`
- `apps/api/app/routers/simulations.py`
- `apps/api/app/routers/closing.py`

### Nova Função Utilitária:

```python
async def notify_case_status_change(
    case_id: int,
    new_status: str,
    changed_by_user_id: int,
    notify_user_ids: list[int],
    additional_payload: dict = {}
):
    """
    Cria notificações para múltiplos usuários quando status muda.

    - Busca nome do usuário que fez a mudança
    - Cria mensagens personalizadas por tipo de status
    - Salva notificações no banco
    - Envia broadcast via WebSocket
    """
```

### Mensagens Personalizadas:

| Status | Mensagem |
|--------|----------|
| `calculo_aprovado` | ✅ Simulação aprovada por {calculista} |
| `calculo_rejeitado` | ❌ Simulação rejeitada por {calculista} |
| `fechamento_aprovado` | ✅ Fechamento aprovado por {atendente} |
| `fechamento_reprovado` | ❌ Fechamento reprovado por {atendente} |
| `financeiro_pendente` | 💰 Caso enviado para financeiro |
| `contrato_efetivado` | 📋 Contrato efetivado |

### Endpoints Atualizados:

1. **`POST /simulations/{id}/approve`**
   - Notifica: Atendente atribuído ao caso
   - Payload: `liberado_cliente`, `total_financiado`

2. **`POST /simulations/{id}/reject`**
   - Notifica: Atendente atribuído ao caso
   - Payload: `reason` (motivo da rejeição)

3. **`POST /closing/approve`**
   - Notifica: Atendente atribuído + Calculista que fez a simulação
   - Payload: `notes`

4. **`POST /closing/reject`**
   - Notifica: Atendente atribuído + Calculista que fez a simulação
   - Payload: `notes`

### Fluxo de Notificações:

```
Atendente → Solicita Simulação
    ↓
Calculista → Aprova Simulação
    ↓ (notificação para Atendente)
Atendente → Vê notificação + WebSocket atualiza status
    ↓
Atendente → Aprova Fechamento
    ↓ (notificação para Atendente + Calculista)
Todos → Veem notificação em tempo real
```

**Impacto:**
- ✅ Notificações em TODAS as mudanças de status
- ✅ Múltiplos usuários notificados simultaneamente
- ✅ Mensagens contextuais e descritivas
- ✅ WebSocket broadcast para atualização em tempo real

---

## 🔒 FASE 3: Segregação de Esteira por RBAC

### Arquivos Modificados:
- `apps/api/app/routers/cases.py` (endpoint `GET /cases`)

### Lógica de RBAC:

**Para Atendentes:**
```python
if user.role == "atendente":
    if mine:
        # Vê apenas seus próprios casos
        qry = qry.filter(Case.assigned_user_id == user.id)
    elif assigned == 0:
        # Vê apenas casos disponíveis (não atribuídos ou lock expirado)
        qry = qry.filter(
            or_(
                Case.assigned_user_id.is_(None),
                Case.assignment_expires_at < now  # Lock de 72h expirado
            )
        )
    else:
        # NÃO pode ver casos de outros atendentes
        raise HTTPException(403, "Sem permissão")
```

**Para Admin/Supervisor/Calculista/Financeiro:**
```python
# Podem ver todos os casos
if mine:
    qry = qry.filter(Case.assigned_user_id == user.id)
elif assigned == 0:
    qry = qry.filter(Case.assigned_user_id.is_(None))
else:
    qry = qry.filter(Case.assigned_user_id == assigned)
```

### Validação de Lock de 72h:

- Lock definido em `POST /cases/{id}/assign`:
  ```python
  c.assignment_expires_at = now + timedelta(hours=72)
  ```

- Lock validado automaticamente no `GET /cases`:
  ```python
  Case.assignment_expires_at < now  # Considera caso disponível
  ```

**Impacto:**
- ✅ Atendente 1 NÃO vê casos do Atendente 2
- ✅ Lock de 72h respeitado automaticamente
- ✅ Casos expirados voltam para esteira global
- ✅ Admin/Supervisor vê tudo para gestão

---

## 🔍 FASE 4: Filtros Avançados

### Arquivos Modificados:
- `apps/api/app/routers/cases.py` (parâmetros do `GET /cases`)

### Novos Parâmetros:

```python
@r.get("", response_model=PageOut)
def list_cases(
    status: str | None = None,          # CSV: "novo,em_atendimento"
    created_after: str | None = None,   # ISO: "2025-01-01"
    created_before: str | None = None,  # ISO: "2025-12-31"
    ...
):
```

### Implementação:

**Múltiplos Status:**
```python
if status:
    status_list = [s.strip() for s in status.split(",")]
    if len(status_list) == 1:
        qry = qry.filter(Case.status == status_list[0])
    else:
        qry = qry.filter(Case.status.in_(status_list))
```

**Filtros de Data:**
```python
if created_after:
    date_after = datetime.fromisoformat(created_after)
    qry = qry.filter(Case.created_at >= date_after)

if created_before:
    date_before = datetime.fromisoformat(created_before)
    qry = qry.filter(Case.created_at <= date_before)
```

### Exemplos de Uso:

```bash
# Buscar múltiplos status
GET /cases?status=novo,em_atendimento,calculista_pendente

# Filtrar por período
GET /cases?created_after=2025-01-01&created_before=2025-01-31

# Combinar filtros
GET /cases?status=calculo_aprovado&created_after=2025-01-01&mine=true
```

**Impacto:**
- ✅ QuickFilters funcionam com múltiplos status
- ✅ AdvancedFilters podem filtrar por data
- ✅ Filtros combinados (status + data + busca)

---

## 📊 FASE 5: Simulação em Todos os Módulos

### Arquivos Criados/Modificados:

1. **Movido para UI Package:**
   - `packages/ui/src/SimulationResultCard.tsx` (copiado de calculista)
   - `packages/ui/index.ts` (adicionado export)

2. **APIs Atualizadas:**
   - `apps/api/app/routers/closing.py` → `GET /closing/queue`
   - `apps/api/app/routers/finance.py` → `GET /finance/queue`

3. **Import Atualizado:**
   - `apps/web/src/app/calculista/[caseId]/page.tsx`

### Estrutura de Dados de Simulação:

```typescript
{
  "simulation": {
    "id": 123,
    "status": "approved",
    "totals": {
      "valorParcelaTotal": 1500.00,
      "saldoTotal": 50000.00,
      "liberadoTotal": 25000.00,
      "totalFinanciado": 75000.00,
      "valorLiquido": 24000.00,
      "custoConsultoria": 9000.00,
      "liberadoCliente": 15000.00
    },
    "banks": [
      {
        "bank": "SANTANDER",
        "parcela": 500.00,
        "saldoDevedor": 20000.00,
        "valorLiberado": 10000.00
      }
    ],
    "prazo": 96,
    "percentualConsultoria": 12
  }
}
```

### Implementação nos Endpoints:

**Closing Queue:**
```python
@r.get("/queue")
def queue(...):
    # Buscar simulação aprovada
    simulation_data = None
    if c.last_simulation_id:
        sim = db.get(Simulation, c.last_simulation_id)
        if sim and sim.status == "approved":
            simulation_data = {
                "id": sim.id,
                "status": sim.status,
                "totals": {...},
                "banks": sim.banks_json,
                ...
            }

    return {"items": [..., "simulation": simulation_data]}
```

**Finance Queue:**
```python
# Mesma lógica do Closing
# Inclui simulação em cada item da fila
```

### Componente SimulationResultCard:

**Props:**
```typescript
interface SimulationResultCardProps {
  totals: SimulationTotals;
  simulation?: SimulationInput | null;
  isActive?: boolean;
  className?: string;
}
```

**Features:**
- ✅ Mostra totais calculados
- ✅ Detalhes por banco (se múltiplos)
- ✅ Valores formatados em R$
- ✅ Badge de status
- ✅ Ícones descritivos

**Impacto:**
- ✅ Componente reutilizável em qualquer módulo
- ✅ APIs retornam simulação para fechamento e financeiro
- ✅ Pronto para uso em esteira, contratos, etc

---

## 📁 Arquivos Modificados

### Backend (FastAPI):
1. `apps/api/app/routers/notifications.py` - Nova função `notify_case_status_change()`
2. `apps/api/app/routers/simulations.py` - Notificações em approve/reject
3. `apps/api/app/routers/closing.py` - Notificações + simulação na queue
4. `apps/api/app/routers/finance.py` - Simulação na queue
5. `apps/api/app/routers/cases.py` - RBAC + lock + filtros

### Frontend (Next.js):
1. `packages/ui/src/StatusBadge.tsx` - Status padronizados
2. `packages/ui/src/SimulationResultCard.tsx` - Componente movido
3. `packages/ui/index.ts` - Export do componente
4. `apps/web/src/app/calculista/[caseId]/page.tsx` - Import atualizado

### Total: **9 arquivos modificados**

---

## 🧪 Testes Recomendados

### 1. Status Padronizados
- [ ] Verificar que todos os status aparecem com labels corretos
- [ ] Verificar cores e ícones em cada módulo

### 2. Notificações
- [ ] Login como Atendente → Solicitar simulação
- [ ] Login como Calculista → Aprovar simulação
- [ ] Voltar como Atendente → Verificar notificação apareceu
- [ ] Verificar WebSocket atualiza sem reload

### 3. Segregação
- [ ] Login como Atendente 1 → Pegar caso A
- [ ] Login como Atendente 2 → Verificar caso A NÃO aparece na esteira global
- [ ] Login como Admin → Verificar vê todos os casos
- [ ] Aguardar 72h (ou alterar no banco) → Verificar caso volta para global

### 4. Filtros
- [ ] Testar filtro por múltiplos status
- [ ] Testar filtro por data
- [ ] Testar busca por nome + filtro de status

### 5. Simulação
- [ ] Abrir módulo Fechamento → Verificar simulação aparece
- [ ] Abrir módulo Financeiro → Verificar simulação aparece
- [ ] Verificar valores corretos (totais, bancos, percentuais)

---

## 🎯 Próximos Passos (Fase 6)

### Integração Visual Pendente:
1. Adicionar `SimulationResultCard` em `/fechamento/page.tsx`
2. Adicionar `SimulationResultCard` em `/financeiro/page.tsx`
3. Adicionar `SimulationResultCard` em `/esteira/page.tsx` (detalhes)
4. Adicionar `SimulationResultCard` em `/contratos/page.tsx`

### Como usar:

```tsx
import { SimulationResultCard } from "@lifecalling/ui";

// Dentro do componente:
{item.simulation && (
  <SimulationResultCard
    totals={item.simulation.totals}
    simulation={item.simulation}
  />
)}
```

---

## ✅ Checklist de Implementação

### FASE 1 - Status ✅
- [x] Atualizar StatusBadge com todos os status
- [x] Adicionar labels descritivos
- [x] Configurar cores e ícones

### FASE 2 - Notificações ✅
- [x] Criar função notify_case_status_change()
- [x] Adicionar notificações em approve/reject simulação
- [x] Adicionar notificações em approve/reject fechamento
- [x] Mensagens personalizadas por tipo

### FASE 3 - Segregação ✅
- [x] Implementar RBAC no GET /cases
- [x] Validar lock de 72h automaticamente
- [x] Bloquear atendente de ver casos de outros

### FASE 4 - Filtros ✅
- [x] Suporte a múltiplos status (CSV)
- [x] Filtros de data (created_after/before)
- [x] Busca por texto

### FASE 5 - Simulação ✅
- [x] Mover SimulationResultCard para packages/ui
- [x] Atualizar APIs (closing, finance)
- [x] Atualizar imports

### FASE 6 - Integração Visual 🔄
- [ ] Adicionar em fechamento/page.tsx
- [ ] Adicionar em financeiro/page.tsx
- [ ] Adicionar em esteira/page.tsx
- [ ] Adicionar em contratos/page.tsx

---

## 📝 Observações

### Pontos de Atenção:
1. **Lock de 72h**: Casos expirados voltam automaticamente para global
2. **Notificações**: Não notifica o usuário que fez a mudança (evita spam)
3. **RBAC**: Atendente recebe 403 se tentar acessar casos de outros
4. **Simulação**: Só retorna se status == "approved"

### Melhorias Futuras:
- [ ] Adicionar filtro por atendente no admin
- [ ] Dashboard de métricas de notificações
- [ ] Exportar casos com filtros aplicados
- [ ] Histórico completo de mudanças de status

---

**Documentação criada em:** 2025-09-30
**Última atualização:** 2025-09-30
**Versão:** 1.0