# Documentação de Alterações - LifeCalling v1

## Última Atualização: 24/10/2025

## Última Atualização: 21/10/2025

---

## 📋 Índice de Sessões

1. [Correções Críticas no Módulo Financeiro (24/10/2025)](#correções-críticas-módulo-financeiro-24102025)
2. [Sistema de Cancelamento de Casos (21/10/2025)](#sistema-de-cancelamento-21102025)
3. [Sistema de Histórico de Simulações (20/10/2024)](#sistema-de-histórico-20102024)
## 🔥 Correções Críticas no Módulo Financeiro (24/10/2025)

### 📋 Resumo Geral

Correção completa do módulo financeiro com foco em:
1. **Sistema de reabertura de casos** efetivados para ajustes
2. **Novos cálculos de KPI** (Receita Total, Impostos, Despesas)
3. **Tipo de receita "Consultoria Bruta"** manual com campos obrigatórios
4. **10 bugs críticos** corrigidos (sintaxe, lógica, UX)

**Total de commits:** 8
**Arquivos modificados:** 7 (3 backend + 4 frontend)
**Linhas alteradas:** ~500

---

### 🎯 Funcionalidades Implementadas

#### 1. Sistema de Reabertura de Casos Efetivados

**Objetivo:** Permitir que Admin e Financeiro reabram casos efetivados para ajustar valores.

**Backend - Endpoint Criado:**
- `POST /finance/cases/{case_id}/reopen` (finance.py linha ~718)
- Permissões: Admin e Financeiro apenas
- Ações: Status → financeiro_pendente + Exclui receitas automáticas

**Frontend:**
- FinanceCard: Botão "Reabrir para Ajuste" (laranja, ícone RotateCcw)
- Hook: `useReopenCase()` com invalidação de queries
- Handler: `handleReopen()` integrado

**Fluxo Completo:**
1. Usuário clica "Reabrir para Ajuste"
2. Confirmação: "Deseja reabrir...? Receitas serão excluídas."
3. Backend altera status + exclui receitas
4. Frontend mostra em "Aguardando Financeiro"

---

#### 2. Novos Cálculos de KPI

| Card | Antes | Depois |
|------|-------|--------|
| Receita Total | Consultoria Líq + Ext + Man | **Consultoria Bruta** + Ext + Man |
| Impostos | Apenas manuais | Manuais + **14% automático** |
| Despesas | Apenas manuais | Manuais + Impostos |
| Consultoria Líq | 86% do custo | 86% (mantém) |

**Implementação (finance.py linhas 367-465):**
- Consultoria Bruta = Σ custo_consultoria (simulações efetivadas)
- Receita Total = Bruta + Externas + Manuais
- Impostos = Manuais + (Receita * 14%)
- Despesas = Manuais + Impostos

---

#### 3. Tipo "Consultoria Bruta" Manual

**Campos Obrigatórios:**
- Atendente (dropdown role "atendente")
- CPF do Cliente (máscara ###.###.###-##)
- Nome do Cliente (texto)

**Validação Backend (finance.py 1531-1542):**
- Verifica se campos estão preenchidos
- Valida formato CPF (11 dígitos)
- Retorna erro 400 se inválido

**UI (IncomeModal.tsx 198-266):**
- Box laranja com contraste melhorado
- Campos condicionais (só aparecem se tipo = "Consultoria Bruta")
- Integração com ranking de atendentes

---

### 🐛 Bugs Críticos Corrigidos

1. **KPIs Zerados (500)**: Falta imports Simulation/Case → Adicionados ✅
2. **CPF "-" na tabela**: GET /transactions sem else → Adicionado else ✅
3. **Botão não aparece**: Lógica dentro bloco errado → Bloco separado ✅
4. **Contraste ruim**: Texto claro em fundo claro → text-gray-900 + bg-white ✅
5. **Hover claro**: bg-amber-50 + texto marrom → bg-amber-600 + texto branco ✅
6. **Status "Liberado"**: contract antes de status → Reordenado ✅
7. **Filtro vazio**: && !i.contract excluía casos → Removido ✅
8. **CPF vazio efetivação**: Falta client_cpf/name → Adicionados ✅
9-10. **Erros JSX**: Tags abertas + imports → Corrigidos ✅

---

### 📊 Arquivos Modificados

**Backend:**
1. models.py - client_cpf + client_name
2. finance.py - Endpoint reopen + métricas + validações + CPF efetivação
3. add_client_fields_to_finance_incomes.sql - Migração ✅

**Frontend:**
4. page.tsx (financeiro) - Lógica status + filtro + handler
5. hooks.ts - useReopenCase
6. IncomeModal.tsx - Campos condicionais + contraste
7. FinanceCard.tsx - Botão reabrir + hover

---

### 📝 Commits (8 total)

- c32d023: feat - Reabertura + KPIs
- 0c5e1d4: fix - Sintaxe JSX FinanceCard
- 18c4837: fix - Sintaxe JSX + imports
- bb3ec0d: fix - Bugs críticos
- 6f652df: fix - CPF/Nome + Botão
- 8f767c5: fix - Bug reabertura + contraste
- 7747a6b: fix - Filtro Aguardando Financeiro
- 08a0fec: fix - CPF efetivação

---

### 📊 Estatísticas

**Versão:** 1.6
**Data:** 24/10/2025
**Funcionalidades:** 3
**Bugs Corrigidos:** 10
**Arquivos:** 7
**Linhas:** ~500

---


---


---

## 🔥 Sistema de Cancelamento de Casos (21/10/2025)

### 📋 Resumo Geral

Correção completa do sistema de cancelamento de casos:
1. **Status específico "caso_cancelado"** criado
2. **Prevenção de duplicação** de casos cancelados
3. **Proteção contra reabertura** em importações de folha
4. **Interface visual** consistente (vermelho para cancelados)
5. **Botões de refresh** funcionais em todos os módulos
6. **Filtros completos** mostrando todos os 14 status
7. **10 bugs críticos** corrigidos

### 🎯 Problemas Corrigidos

#### Problema 1: Broadcast WebSocket Inconsistente
- **Status no banco:** `"encerrado"`
- **Broadcast WebSocket:** `"cancelado"` ❌
- **Correção:** Status e broadcast agora são `"caso_cancelado"` ✅

#### Problema 2: Reabertura Automática Indevida
- **Antes:** Casos cancelados eram reabertos como "novo" após importação
- **Depois:** Casos cancelados mantêm status após importação ✅

#### Problema 3-5: Frontend Não Mostrava Status Correto
- Endpoint `/finance/queue` não retornava casos cancelados
- Contador e filtro "Cancelados" incompletos
- **Correção:** Ambos incluem `"caso_cancelado"` e `"contrato_cancelado"` ✅

#### Problema 6-7: Interface Visual Incorreta
- Status aparecia como "Fechamento Aprovado" (verde) em vez de "Cancelado" (vermelho)
- Botão "Efetivar Liberação" aparecia em casos cancelados
- **Correção:** Status correto + botão oculto ✅

#### Problema 8: Sistema Criava Casos Duplicados (CRÍTICO)
- **Situação:** Cliente com caso #52 (cancelado) → importação criava caso #54 (novo)
- **Causa Raiz:** Casos cancelados não estavam em nenhuma categoria (OPEN/CLOSED)
- **Correção:** Nova categoria `CANCELED_STATUSES` implementada ✅

#### Problemas 9-10: Botões de Refresh Não Funcionavam
- Financeiro: Não tinha botão para atualizar lista de casos
- Calculista: Botão genérico `refetchQueries()` não funcionava
- **Correção:** Botões específicos com queries corretas ✅

---

## 🔧 Sistema de Histórico de Simulações (20/10/2024)

### 📋 Resumo Geral

Implementação completa de:
1. Sistema de versionamento de simulações
2. Histórico completo de todas as versões
3. Correção do fluxo Fechamento → Calculista → Financeiro
4. Botão de devolução de casos do Financeiro para Calculista
5. Botão de cancelamento de casos
6. Melhorias de UX e correções de bugs

---

## 🔧 1. Sistema de Histórico de Simulações

### Problema Original
- Simulações eram sobrescritas a cada edição
- Apenas a última versão ficava salva
- Não havia histórico de mudanças
- Impossível comparar versões anteriores

### Solução Implementada

#### Backend (Python/FastAPI)

**Arquivo:** `apps/api/app/routers/simulations.py`

**Endpoint POST `/simulations/{case_id}` - Reformulado (linhas 257-384)**
```python
# ANTES: Sobrescrevia simulação draft existente
existing_sim = db.query(Simulation).filter(
    Simulation.case_id == case_id,
    Simulation.status == "draft"
).first()

# DEPOIS: Sempre cria nova versão
old_drafts = db.query(Simulation).filter(
    Simulation.case_id == case_id,
    Simulation.status == "draft"
).all()

for old_sim in old_drafts:
    old_sim.status = "superseded"  # ✅ Marca como antiga

sim = Simulation(case_id=case_id, status="draft")  # ✅ Nova versão
```

**Novo status:** `"superseded"` - Identifica versões antigas

**Novo Endpoint GET `/simulations/case/{case_id}/all` (linhas 547-605)**
- Retorna TODAS as simulações de um caso
- Ordenadas por data (mais recente primeiro)
- Flag `is_current` identifica a simulação ativa
- Suporta status: `draft`, `superseded`, `approved`, `rejected`

**Novo Endpoint POST `/simulations/{sim_id}/set-as-final` (linhas 706-763)**
- Define qual simulação aprovada será enviada ao financeiro
- Atualiza `Case.last_simulation_id`
- Permite escolher entre múltiplas simulações aprovadas

#### Frontend (React/TypeScript)

**Arquivo:** `apps/web/src/lib/simulation-hooks.ts`

**Novos Hooks (linhas 301-344):**
```typescript
// Busca TODAS as simulações de um caso
useAllCaseSimulations(caseId)

// Define simulação como final
useSetFinalSimulation()
```

**Arquivo:** `packages/ui/src/SimulationHistoryModal.tsx`

**Melhorias:**
- Badge "ATUAL" para simulação selecionada
- Status coloridos:
  - 🟢 Aprovada (verde)
  - ❌ Rejeitada (vermelho)
  - 🔵 Rascunho (azul)
  - ⚪ Antiga/Superseded (cinza)
- Botão "Selecionar como Final" para simulações aprovadas
- Contador de versões

---

## 🔄 2. Correção do Fluxo: Fechamento → Calculista → Financeiro

### Problema Original
Quando caso voltava do fechamento aprovado, ao aprovar a simulação ela retornava ao atendente em vez de ir direto ao financeiro.

### Solução

**Arquivo:** `apps/api/app/routers/simulations.py`

**Endpoint POST `/simulations/{sim_id}/approve` (linhas 406-476)**

```python
# ANTES: Sempre mudava para "calculo_aprovado"
case.status = "calculo_aprovado"

# DEPOIS: Detecta contexto
if case.status == "fechamento_aprovado":
    case.status = "financeiro_pendente"  # ✅ Vai direto ao financeiro
else:
    case.status = "calculo_aprovado"     # ✅ Vai ao fechamento
```

**Evento Adicional:**
- Quando vai ao financeiro, cria evento `case.sent_to_finance`
- Flag `auto_sent: true` identifica envio automático

---

## 🔁 3. Devolução de Casos: Financeiro → Calculista

### Implementação

**Backend:** `apps/api/app/routers/cases.py`

**Endpoint POST `/cases/{case_id}/return-to-calculista` (linhas 1583-1619)**
- Muda status para `"devolvido_financeiro"`
- Cria evento de rastreamento
- Permissões: `admin`, `supervisor`, `financeiro`

**Frontend - FinanceCard:** `packages/ui/src/FinanceCard.tsx`

**Nova prop:** `onReturnToCalculista` (linha 65)

**Botão "Devolver" (linhas 586-598)**
```typescript
<Button
  className="text-orange-600 border-orange-400
             hover:bg-orange-600 hover:text-white"
>
  <Undo2 /> Devolver
</Button>
```

**Frontend - Dashboard Calculista:** `apps/web/src/app/calculista/page.tsx`

**Nova Aba "Devolvidos" (linhas 254-265, 434-436, 573-631)**
- Query busca casos com status `"devolvido_financeiro"`
- Visual destacado em laranja
- Card com aviso "⚠️ Devolvido para recálculo pelo financeiro"

---

## ❌ 4. Cancelamento de Casos

### Implementação

**Backend:** `apps/api/app/routers/cases.py`

**Endpoint POST `/cases/{case_id}/cancel`**
```python
@r.post("/{case_id}/cancel")
async def cancel_case(case_id: int, user=...):
    """Cancela um caso (muda status para 'encerrado')"""
    case.status = "encerrado"  # ✅ Status correto
    # Cria evento case.cancelled
    # Broadcast via WebSocket
```

**Permissões:** `admin`, `supervisor`, `financeiro`

**Frontend - FinanceCard:** `packages/ui/src/FinanceCard.tsx`

**Modal de Confirmação (linhas 1118-1157)**
- Dialog profissional
- Ícone de alerta ⚠️
- Mensagem clara com nome do cliente
- Botões "Voltar" e "Cancelar Caso"

**Botão "Cancelar Caso" (linhas 614-624)**
- Variant destructive (vermelho)
- Full-width
- Abre modal de confirmação

---

## ⚡ 5. Aprovar Sem Precisar Recalcular

### Problema
Calculista era obrigado a clicar em "Calcular Simulação" mesmo sem editar nada, apenas para habilitar "Aprovar e Enviar".

### Solução

**Arquivo:** `apps/web/src/app/calculista/[caseId]/page.tsx`

**useEffect Adicional (linhas 121-157)**
- Carrega simulação automaticamente quando vem do fechamento
- Popula `simulationId` e `currentTotals`
- Preenche formulário com dados existentes

**Função handleApprove (linhas 226-235)**
```typescript
// ✅ Usa fallback para last_simulation_id
const simIdToApprove = simulationId || caseDetail?.last_simulation_id;

if (!simIdToApprove) {
  toast.error("Salve a simulação antes de aprovar");
  return;
}
approveSimulationMutation.mutate(simIdToApprove);
```

**Benefício:** Calculista pode aprovar direto sem recalcular!

---

## 🎨 6. Melhorias de UI/UX

### FinanceCard - Botões Reorganizados

**Arquivo:** `packages/ui/src/FinanceCard.tsx` (linhas 571-627)

**Layout para status `financeiro_pendente`:**
```
┌─────────────────────────────────────┐
│ Linha 1: [Ver Detalhes] [Devolver] │  (inline)
│ Linha 2: [Efetivar Liberação]      │  (full-width, verde)
│ Linha 3: [Cancelar Caso]           │  (full-width, vermelho)
└─────────────────────────────────────┘
```

**Botão "Devolver" com hover melhorado:**
- Estado normal: Texto laranja + borda laranja
- Hover: Fundo laranja + texto branco ✅

### Status da Simulação

**Arquivo:** `apps/web/src/app/financeiro/page.tsx` (linhas 922-928)

```typescript
// ✅ Corrigido mapeamento de status
if (item.status === "financeiro_pendente") return "financeiro_pendente";
if (item.status === "fechamento_aprovado") return "fechamento_aprovado";
```

---

## 🐛 7. Correções de Bugs

### Bug 1: Erro React Key
**Arquivo:** `packages/ui/src/SimulationHistoryModal.tsx` (linha 200)

```typescript
// ANTES:
key={entry.simulation_id}

// DEPOIS:
key={`simulation-${entry.simulation_id}-${index}`}
```

### Bug 2: Exclusão de Despesas de Comissão
**Arquivo:** `apps/api/app/routers/finance.py` (linha 1174)

```python
# ANTES:
user=Depends(require_roles("admin", "supervisor"))

// DEPOIS:
user=Depends(require_roles("admin", "supervisor", "financeiro"))
```

### Bug 3: KPIs com Erro 500
**Arquivo:** `apps/web/src/app/calculista/page.tsx` (linhas 151-154)

```typescript
// Temporariamente desabilitado
// const { data: kpis } = useCalculationKpis({ month: currentMonth });
const kpis = null;
const isLoadingKpis = false;
```

---

## 📊 Fluxo Completo Atualizado

```
ATENDENTE cria caso
  ↓
CALCULISTA calcula e aprova
  ↓ (status: calculo_aprovado)
ATENDENTE envia ao fechamento
  ↓
FECHAMENTO aprova
  ↓ (status: fechamento_aprovado)
CALCULISTA revisa
  ├─→ [Opção A] Aprova direto (sem editar)
  │   └─→ FINANCEIRO (status: financeiro_pendente) ✅
  └─→ [Opção B] Edita e aprova
      └─→ FINANCEIRO (status: financeiro_pendente) ✅
  ↓
FINANCEIRO recebe
  ├─→ [Opção A] Efetiva contrato → ENCERRADO ✅
  ├─→ [Opção B] Devolve para recálculo
  │   └─→ CALCULISTA (status: devolvido_financeiro)
  └─→ [Opção C] Cancela caso → ENCERRADO ✅
```

---

## 📝 Arquivos Modificados

### Backend (Python/FastAPI)
1. `apps/api/app/routers/simulations.py` - Sistema de versionamento
2. `apps/api/app/routers/cases.py` - Endpoints de devolução e cancelamento
3. `apps/api/app/routers/finance.py` - Permissões de exclusão

### Frontend (React/TypeScript)
1. `apps/web/src/lib/simulation-hooks.ts` - Novos hooks
2. `apps/web/src/app/calculista/[caseId]/page.tsx` - Aprovação sem recalcular
3. `apps/web/src/app/calculista/page.tsx` - Aba de devolvidos
4. `apps/web/src/app/financeiro/page.tsx` - Handlers de ações
5. `packages/ui/src/FinanceCard.tsx` - Botões e modais
6. `packages/ui/src/SimulationHistoryModal.tsx` - Histórico visual

---

## 🎯 Benefícios Entregues

✅ **Rastreabilidade Total** - Histórico completo de todas as versões
✅ **Sem Perda de Dados** - Todas as simulações ficam salvas
✅ **Fluxo Correto** - Casos vão direto ao financeiro após fechamento
✅ **Flexibilidade** - Financeiro pode devolver casos problemáticos
✅ **UX Melhorada** - Não precisa recalcular desnecessariamente
✅ **Visual Claro** - Badges e cores identificam status facilmente
✅ **Auditoria** - Eventos rastreiam todas as ações

---

---

## 🚀 Próximas Melhorias e Correções

### 🎯 Alta Prioridade

#### 1. **Campo Editável para Consultoria Líquida na Efetivação**

**Problema:**
- Valor da consultoria calculado na simulação às vezes precisa ser ajustado
- Pode ser valor diferente ou valor fixo
- Financeiro não consegue editar manualmente

**Solução Proposta:**
```typescript
// Modal de Efetivar Contrato - adicionar campo editável
<Input
  label="Consultoria Líquida"
  value={consultoriaLiquidaEditavel}
  onChange={(v) => setConsultoriaLiquidaEditavel(v)}
  type="currency"
  defaultValue={simulacao.totals.custoConsultoriaLiquido}
/>
```

**Benefícios:**
- ✅ Financeiro pode ajustar valor manualmente
- ✅ Valor editado substitui o da simulação
- ✅ Flexibilidade para casos especiais
- ✅ Mantém rastreabilidade (valor original + ajustado)

**Arquivos a Modificar:**
- `packages/ui/src/FinanceCard.tsx` - Modal de efetivação
- `apps/api/app/routers/finance.py` - Endpoint POST `/finance/disburse`
- `apps/api/app/models.py` - Adicionar campo `consultoria_liquida_ajustada` (opcional)

---

#### 2. **Ajustes no Sistema de Impostos**

**Itens a Revisar:**
- [ ] Cálculo de IRPF (Imposto de Renda Pessoa Física)
- [ ] Cálculo de INSS (Instituto Nacional do Seguro Social)
- [ ] Alíquotas progressivas corretas
- [ ] Deduções e isenções aplicáveis
- [ ] Tabelas atualizadas (2025)

**Arquivos Envolvidos:**
- `apps/web/src/lib/utils/simulation-calculations.ts`
- `apps/api/app/utils/calculations.py` (se existir)

**Ação Requerida:**
- Especificar quais impostos/cálculos estão incorretos
- Fornecer regras de negócio corretas
- Validar com exemplos reais

---

#### 3. **Distribuição da Consultoria Líquida (Atendente + Balcão)**

**Regra Atual:**
- 100% da consultoria líquida vai para o financeiro
- Comissão separada (configurável por caso)

**Nova Regra Proposta:**
```
Consultoria Líquida Total
  ├─→ Porcentagem para Atendente (configurável, ex: 70%)
  │   └─→ Receita do Atendente
  └─→ Diferença Restante (ex: 30%)
      └─→ Receita do Balcão (consultoria)

❌ REMOVER sistema de "Comissão" separado
✅ USAR apenas sistema de distribuição percentual
```

**Exemplo:**
```
Consultoria Líquida: R$ 1.000,00
Atendente (70%): R$ 700,00
Balcão (30%): R$ 300,00
```

**Implementação:**
1. Adicionar campo `percentual_atendente` na efetivação do contrato
2. Calcular automaticamente:
   - `receita_atendente = consultoria_liquida * (percentual_atendente / 100)`
   - `receita_balcao = consultoria_liquida - receita_atendente`
3. Criar 2 entradas na tabela de receitas:
   - Receita tipo "Consultoria - Atendente" (user_id = atendente)
   - Receita tipo "Consultoria - Balcão" (user_id = null ou admin)
4. Remover sistema de "Comissão"

**Arquivos a Modificar:**
- `apps/api/app/routers/finance.py` - Endpoint POST `/finance/disburse`
- `apps/api/app/models.py` - Modelo Contract/Revenue
- `packages/ui/src/FinanceCard.tsx` - Modal de efetivação
- `apps/web/src/app/financeiro/page.tsx` - Tabela de receitas

---

#### 4. **Módulo de Criação de Cliente/Caso**

**Objetivo:**
- Interface para criar clientes manualmente (não via importação)
- Criar casos manualmente

**Funcionalidades:**
1. **Formulário de Criação de Cliente:**
   - Nome completo
   - CPF (validação)
   - Matrícula
   - Órgão/Entidade
   - Telefone preferencial
   - Banco, Agência, Conta
   - Chave PIX (opcional)
   - Observações

2. **Criação Automática de Caso:**
   - Ao criar cliente, criar caso automaticamente
   - Status inicial: "novo"
   - Atribuir ao usuário que criou (opcional)

3. **Validações:**
   - CPF único (não permitir duplicatas)
   - Formato de CPF válido
   - Campos obrigatórios

**Arquivos a Criar/Modificar:**
- `apps/web/src/app/clientes/novo/page.tsx` - Página de criação
- `apps/api/app/routers/clients.py` - Endpoint POST `/clients`
- `packages/ui/src/ClientForm.tsx` - Componente de formulário

**Layout Sugerido:**
```
┌─────────────────────────────────────────┐
│ Novo Cliente                            │
│                                         │
│ [Dados Pessoais]                        │
│ Nome: ___________                       │
│ CPF: ___________                        │
│ Matrícula: ___________                  │
│ Órgão: ___________                      │
│                                         │
│ [Contato]                               │
│ Telefone: ___________                   │
│                                         │
│ [Dados Bancários]                       │
│ Banco: ___________                      │
│ Agência: ___________                    │
│ Conta: ___________                      │
│ Chave PIX: ___________                  │
│                                         │
│ [Observações]                           │
│ ___________                             │
│                                         │
│ [Cancelar] [Criar Cliente e Caso]      │
└─────────────────────────────────────────┘
```

---

### 📝 Melhorias Secundárias

#### 5. Filtros de Busca no Histórico de Simulações
- Buscar por data
- Buscar por status
- Buscar por valor

#### 6. Comentários/Notas nas Devoluções
- Campo de texto ao devolver caso
- Histórico de comentários visível

#### 7. Relatório de Casos Devolvidos
- Métricas de devoluções
- Motivos mais comuns
- Usuários com mais devoluções

#### 8. Notificações Push
- Quando caso é devolvido
- Quando caso é aprovado
- Quando contrato é efetivado

#### 9. Corrigir Endpoint `/calculation/kpis`
- Atualmente retorna erro 500
- Desabilitado temporariamente

---

### 📊 Estatísticas Acumuladas

**Versão Atual:** 1.5
**Data:** 21/10/2025

**Total de Funcionalidades Implementadas:**
- ✅ Sistema de Histórico de Simulações
- ✅ Sistema de Cancelamento Completo
- ✅ Devolução de Casos (Financeiro → Calculista)
- ✅ Filtros Completos de Status
- ✅ Botões de Refresh Funcionais

**Total de Bugs Corrigidos:** 15+
**Total de Arquivos Modificados:** 15+
**Total de Linhas Alteradas:** ~500+

---

**Documentação gerada e mantida por Claude Code**
**Última Atualização:** 21/10/2025
