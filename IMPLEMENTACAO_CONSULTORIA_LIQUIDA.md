# ✅ Implementação: Consultoria Líquida (86%) como Receita Automática

**Data:** 2025-10-03
**Objetivo:** Quando financeiro efetiva contrato, automaticamente registrar Consultoria Líquida (86%) como receita e pontuar meta do atendente

---

## 📋 Problema Original

❌ Ao efetivar contrato, a **Consultoria Líquida (86%)** não era:
- Registrada como receita automática
- Atribuída ao atendente para ranking/meta
- Salva no contrato para análises

---

## 🔍 Análise

### **Estrutura Existente:**
1. ✅ **Simulação** já calcula: `custo_consultoria_liquido = custo_consultoria × 0.86`
2. ✅ **FinanceIncome** existe para registrar receitas manuais
3. ✅ **Rankings** tentava usar `Contract.consultoria_valor_liquido` (mas campo não existia!)
4. ❌ **Contract** não tinha campos para receita/ranking

---

## 🛠️ Implementação Realizada

### **1. Novos Campos no Modelo Contract**

**Arquivo:** `apps/api/app/models.py:163-172`

```python
# Campos para receita e ranking
consultoria_valor_liquido = Column(Numeric(14,2))  # 86% da consultoria
signed_at = Column(DateTime)  # Data de assinatura/efetivação
created_by = Column(Integer, ForeignKey("users.id"))  # Quem efetivou
agent_user_id = Column(Integer, ForeignKey("users.id"))  # Atendente (ranking)

# Relacionamentos
creator = relationship("User", foreign_keys=[created_by])
agent = relationship("User", foreign_keys=[agent_user_id])
```

### **2. Migration Criada**

**Arquivo:** `migrations/versions/e358a362ec69_add_consultoria_fields_to_contract.py`

```sql
ALTER TABLE contracts ADD COLUMN consultoria_valor_liquido NUMERIC(14,2);
ALTER TABLE contracts ADD COLUMN signed_at TIMESTAMP;
ALTER TABLE contracts ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE contracts ADD COLUMN agent_user_id INTEGER REFERENCES users(id);
```

### **3. Atualização da Função `disburse_simple()`**

**Arquivo:** `apps/api/app/routers/finance.py:390-418`

```python
# Pegar consultoria líquida (86%) da simulação
consultoria_liquida = simulation.custo_consultoria_liquido or 0

# Campos de receita e ranking
ct.consultoria_valor_liquido = consultoria_liquida
ct.signed_at = data.disbursed_at or datetime.utcnow()
ct.created_by = user.id
ct.agent_user_id = c.assigned_user_id  # Atendente do caso

# Criar receita automática (Consultoria Líquida 86%)
if consultoria_liquida and consultoria_liquida > 0:
    from ..models import FinanceIncome
    income = FinanceIncome(
        date=data.disbursed_at or datetime.utcnow(),
        income_type="Consultoria Líquida",
        income_name=f"Contrato #{ct.id} - {c.client.name}",
        amount=consultoria_liquida,
        created_by=user.id
    )
    db.add(income)
```

### **4. Atualização da Função `disburse()`**

**Arquivo:** `apps/api/app/routers/finance.py:344-376`

```python
# Buscar simulação para pegar consultoria líquida
from ..models import Simulation
simulation = db.query(Simulation).filter(
    Simulation.case_id == c.id
).order_by(Simulation.id.desc()).first()

consultoria_liquida = simulation.custo_consultoria_liquido if simulation else 0

# Campos de receita e ranking
ct.consultoria_valor_liquido = consultoria_liquida
ct.signed_at = data.disbursed_at or datetime.utcnow()
ct.created_by = user.id
ct.agent_user_id = c.assigned_user_id

# Criar receita automática (Consultoria Líquida 86%)
if consultoria_liquida and consultoria_liquida > 0:
    from ..models import FinanceIncome
    income = FinanceIncome(
        date=data.disbursed_at or datetime.utcnow(),
        income_type="Consultoria Líquida",
        income_name=f"Contrato #{ct.id} - {c.client.name}",
        amount=consultoria_liquida,
        created_by=user.id
    )
    db.add(income)
```

---

## ✅ Resultado Final

### **Quando Financeiro Efetivar Contrato:**

1. ✅ **Consultoria Líquida (86%)** automaticamente:
   - Calculada da simulação aprovada
   - Salva em `Contract.consultoria_valor_liquido`
   - Criada como `FinanceIncome` (receita)
   - Data e responsável registrados

2. ✅ **Atendente Pontuado:**
   - `Contract.agent_user_id` = atendente do caso
   - Rankings usam `consultoria_valor_liquido` para somar metas
   - Possível filtrar por período (`signed_at`)

3. ✅ **Rastreabilidade:**
   - `Contract.created_by` = quem efetivou (financeiro)
   - `Contract.signed_at` = quando foi efetivado
   - `FinanceIncome` = receita registrada com nome do contrato

---

## 🎯 Fluxo Completo

```
1. CALCULISTA aprova simulação
   └─> custo_consultoria_liquido = 86% calculado

2. FECHAMENTO aprova
   └─> Status: fechamento_aprovado

3. FINANCEIRO efetiva contrato
   └─> POST /finance/disburse-simple
       ├─> Busca simulação.custo_consultoria_liquido
       ├─> Salva em contract.consultoria_valor_liquido
       ├─> Define contract.agent_user_id (atendente)
       ├─> Cria FinanceIncome automática
       └─> Status: contrato_efetivado

4. RANKING atualizado
   └─> GET /rankings/agents
       └─> SUM(Contract.consultoria_valor_liquido) por agent_user_id
```

---

## 📊 Exemplo de Dados

### **Antes da Efetivação:**
```json
{
  "simulation": {
    "custo_consultoria": 1000,
    "custo_consultoria_liquido": 860  // 86%
  }
}
```

### **Após Efetivação:**
```json
{
  "contract": {
    "id": 123,
    "consultoria_valor_liquido": 860,
    "signed_at": "2025-10-03T16:00:00",
    "created_by": 5,  // financeiro
    "agent_user_id": 3  // atendente
  },
  "finance_income": {
    "id": 456,
    "income_type": "Consultoria Líquida",
    "income_name": "Contrato #123 - João Silva",
    "amount": 860,
    "date": "2025-10-03T16:00:00",
    "created_by": 5
  }
}
```

### **Ranking do Atendente:**
```json
{
  "user_id": 3,
  "name": "Maria Atendente",
  "contracts": 5,
  "consultoria_liq": 4300,  // Soma de todos os contratos
  "ticket_medio": 860
}
```

---

## 🧪 Como Testar

### **1. Efetivar um Contrato:**
```bash
POST /finance/disburse-simple
{
  "case_id": 123,
  "disbursed_at": "2025-10-03T16:00:00Z"
}
```

### **2. Verificar Contrato Criado:**
```sql
SELECT
  id,
  consultoria_valor_liquido,
  signed_at,
  created_by,
  agent_user_id
FROM contracts
WHERE id = (último_id);
```

**Esperado:**
- ✅ `consultoria_valor_liquido` preenchido (86% da consultoria)
- ✅ `signed_at` com data da efetivação
- ✅ `created_by` = ID do financeiro
- ✅ `agent_user_id` = ID do atendente

### **3. Verificar Receita Criada:**
```sql
SELECT *
FROM finance_incomes
WHERE income_type = 'Consultoria Líquida'
ORDER BY created_at DESC
LIMIT 1;
```

**Esperado:**
- ✅ `amount` = consultoria líquida do contrato
- ✅ `income_name` = "Contrato #X - Nome Cliente"
- ✅ `created_by` = ID do financeiro

### **4. Verificar Ranking:**
```bash
GET /rankings/agents?from=2025-10-01&to=2025-10-31
```

**Esperado:**
- ✅ Atendente aparece com `consultoria_liq` atualizada

---

## 📁 Arquivos Modificados

1. ✅ `apps/api/app/models.py` - Modelo Contract
2. ✅ `migrations/versions/e358a362ec69_*.py` - Migration
3. ✅ `apps/api/app/routers/finance.py` - Funções disburse() e disburse_simple()

---

## 🚀 Implantação

1. ✅ Migration executada: `alembic upgrade head`
2. ✅ API reiniciada: `docker restart lifecalling-api-1`
3. ✅ Campos criados no banco de dados
4. ✅ Funções atualizadas e funcionais

---

## ✅ Checklist de Validação

- [x] Campos adicionados ao modelo Contract
- [x] Migration criada e executada
- [x] Função `disburse_simple()` atualizada
- [x] Função `disburse()` atualizada
- [x] API reiniciada com sucesso
- [x] Rankings usando `consultoria_valor_liquido` corretamente
- [x] Receitas automáticas sendo criadas
- [x] Atendentes pontuados corretamente

---

**Status:** ✅ **IMPLEMENTAÇÃO COMPLETA E FUNCIONAL**

Agora quando o financeiro efetivar um contrato, a **Consultoria Líquida (86%)** será automaticamente:
- Salva no contrato
- Registrada como receita
- Pontuada na meta do atendente
