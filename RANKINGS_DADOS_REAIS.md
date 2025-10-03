# 🔧 Correção: Rankings com Dados Reais + Sistema de Campanhas

## Data: 2025-10-03

---

## 📋 Problema Identificado

O módulo de Rankings não estava exibindo dados reais dos atendimentos, mesmo com 12 casos no sistema (5 finalizados).

### Causa Raiz:
```python
# Query estava muito restritiva:
.filter(Contract.status == "ativo")  # ❌ Só pegava contratos "ativos"
.filter(func.date(Contract.signed_at).between(start, end))  # ❌ Precisava de signed_at
```

---

## ✅ Soluções Implementadas

### 1. **Ajuste nas Queries de Rankings**

**Arquivo:** `apps/api/app/routers/rankings.py`

#### 1.1 Remoção de Filtro Restritivo
```python
# ANTES
.filter(Contract.status == "ativo")

# DEPOIS
# Comentado para incluir todos os contratos
```

#### 1.2 Fallback de Datas
```python
# ANTES
func.date(Contract.signed_at).between(start, end)

# DEPOIS
func.coalesce(Contract.signed_at, Contract.disbursed_at, Contract.created_at).between(start, end)
```

#### 1.3 Joins com Outer
```python
# ANTES
.join(Case, Case.id == Contract.case_id)

# DEPOIS
.join(Case, Case.id == Contract.case_id, isouter=True)
```

### Resultado:
- ✅ Todos os contratos são incluídos no ranking
- ✅ Usa `created_at` como fallback se `signed_at` não existir
- ✅ Não quebra se não houver Case associado

---

### 2. **Sistema Completo de Campanhas**

Criado sistema de gerenciamento de campanhas de engajamento com premiações.

#### 2.1 Backend - API de Campanhas

**Novo Arquivo:** `apps/api/app/routers/campanhas.py`

**Endpoints criados:**

```python
GET    /campanhas              # Listar campanhas (com filtro por status)
POST   /campanhas              # Criar nova campanha
GET    /campanhas/{id}         # Obter campanha específica
PUT    /campanhas/{id}         # Atualizar campanha
DELETE /campanhas/{id}         # Deletar campanha
```

**Estrutura de Dados:**
```json
{
  "id": 1,
  "nome": "Campanha de Natal 2024",
  "descricao": "Bata a meta em dezembro...",
  "periodo": "01/12/2024 - 31/12/2024",
  "data_inicio": "2024-12-01",
  "data_fim": "2024-12-31",
  "status": "ativa",  // ativa | proxima | encerrada
  "premiacoes": [
    { "posicao": "1º Lugar", "premio": "R$ 5.000 + Viagem" },
    { "posicao": "2º Lugar", "premio": "R$ 3.000 + Voucher" }
  ],
  "progresso": 68,
  "vencedores": null,
  "created_at": "2024-10-03T...",
  "created_by": 1
}
```

**Validações:**
- ✅ Data fim não pode ser anterior à data início
- ✅ Status deve ser: ativa, proxima ou encerrada
- ✅ Pelo menos uma premiação
- ✅ RBAC: apenas admin e supervisor podem criar/editar

**Armazenamento:**
- Por enquanto: Em memória (variável `CAMPANHAS_DB`)
- Próximo passo: Migrar para banco PostgreSQL

#### 2.2 Frontend - Modal de Nova Campanha

**Arquivo:** `apps/web/src/app/rankings/page.tsx`

**Componente Dialog/Modal com:**

```tsx
<Dialog> // Modal controlado
  <DialogContent>
    {/* Campos do formulário */}
    - Nome da Campanha
    - Descrição
    - Data de Início
    - Data de Fim
    - Status (dropdown)
    - Premiações (dinâmicas)
  </DialogContent>
</Dialog>
```

**Features do Formulário:**

1. **Premiações Dinâmicas:**
   - Adicionar nova premiação (+)
   - Remover premiação (ícone lixeira)
   - Campos: Posição + Prêmio

2. **Validações:**
   - Campos obrigatórios
   - Mínimo 1 premiação
   - Toast de sucesso/erro

3. **Estados:**
   ```tsx
   const [novaCampanha, setNovaCampanha] = useState({
     nome: "",
     descricao: "",
     data_inicio: "",
     data_fim: "",
     status: "proxima",
     premiacoes: [
       { posicao: "1º Lugar", premio: "" },
       { posicao: "2º Lugar", premio: "" },
       { posicao: "3º Lugar", premio: "" }
     ]
   });
   ```

4. **Mutation:**
   ```tsx
   const criarCampanhaMutation = useMutation({
     mutationFn: async (data) => await api.post("/campanhas", data),
     onSuccess: () => {
       queryClient.invalidateQueries(["campanhas"]);
       toast.success("Campanha criada!");
       setShowNovaCampanhaModal(false);
     }
   });
   ```

#### 2.3 Integração na Página

**Botão "Nova Campanha":**
```tsx
<Button className="flex items-center gap-2">
  <Plus className="h-4 w-4" />
  Nova Campanha
</Button>
```

**Lista de Campanhas:**
- Busca dados da API (substituindo mocks inline)
- Loading state
- Empty state (quando não há campanhas)
- Renderização dinâmica dos cards

---

## 🎨 3. Melhorias Visuais

### Campanhas Ativas:
- Badge verde "🟢 Ativa"
- Barra de progresso
- Botão "Ver Ranking da Campanha"

### Campanhas Próximas:
- Badge azul "🔵 Próxima"
- Sem progresso

### Campanhas Encerradas:
- Badge cinza "⚫ Encerrada"
- Lista de vencedores com medalhas 🥇🥈🥉

---

## 📂 4. Arquivos Criados/Modificados

### Backend (3 arquivos):
1. ✏️ `apps/api/app/routers/rankings.py` - Queries ajustadas
2. 📄 `apps/api/app/routers/campanhas.py` - **NOVO** - API de campanhas
3. ✏️ `apps/api/app/main.py` - Registro do router de campanhas

### Frontend (1 arquivo):
4. ✏️ `apps/web/src/app/rankings/page.tsx` - Modal + integração

### Documentação (1 arquivo):
5. 📄 `RANKINGS_DADOS_REAIS.md` - Este documento

---

## 🚀 5. Como Testar

### 5.1 Verificar Dados Reais nos Rankings

1. Acesse `/rankings`
2. Verifique se aparecem atendentes com dados
3. Se tiver contratos no banco, devem aparecer no ranking
4. Medalhas 🥇🥈🥉 para o top 3

### 5.2 Criar Nova Campanha

1. Clique em **"Nova Campanha"**
2. Preencha:
   - Nome: "Teste de Campanha"
   - Descrição: "Campanha de teste"
   - Data início: Hoje
   - Data fim: Daqui a 30 dias
   - Status: "Ativa"
3. Adicione premiações:
   - 1º Lugar: R$ 1.000
   - 2º Lugar: R$ 500
4. Clique em **"Criar Campanha"**
5. Deve aparecer toast de sucesso
6. Campanha deve aparecer na lista

### 5.3 Verificar API

```bash
# Listar campanhas
GET http://localhost:8000/campanhas

# Criar campanha
POST http://localhost:8000/campanhas
{
  "nome": "Campanha Teste",
  "descricao": "Descrição",
  "data_inicio": "2024-12-01",
  "data_fim": "2024-12-31",
  "status": "proxima",
  "premiacoes": [
    { "posicao": "1º", "premio": "R$ 1000" }
  ]
}
```

---

## 🔄 6. Próximos Passos

### Curto Prazo:
1. **Migrar campanhas para PostgreSQL**
   - Criar modelo `Campaign` e `CampaignReward`
   - Migration do banco
   - Substituir `CAMPANHAS_DB` por queries

2. **Ranking por Campanha**
   - Endpoint `/campanhas/{id}/ranking`
   - Filtro de período específico da campanha
   - Cálculo de posições

3. **Atualização de Progresso**
   - Job/cron para calcular progresso automaticamente
   - PUT `/campanhas/{id}` com progresso

### Médio Prazo:
4. **Dashboard de Campanha**
   - Página individual `/campanhas/{id}`
   - Gráficos de progresso
   - Participantes

5. **Notificações**
   - Notificar quando campanha inicia
   - Notificar vencedores
   - Lembrete de prazos

### Longo Prazo:
6. **Gamificação Avançada**
   - Pontos acumulados
   - Badges/conquistas
   - Ranking geral + por campanha

---

## 📊 7. Estrutura Atual

```
Rankings Page
│
├── Filtros de Período (De/Até)
│
├── Meus Números (3 KPIs)
│   ├── Meus Contratos
│   ├── Minha Consultoria Líquida
│   └── Atingimento de Meta (R$ 10.000)
│
├── 🏆 Ranking de Atendentes
│   ├── Top 3 com medalhas 🥇🥈🥉
│   ├── Tabela com dados reais
│   └── Progresso de meta (R$ 10.000)
│
└── 🎁 Campanhas de Engajamento
    ├── Botão "Nova Campanha" → Modal
    ├── Loading / Empty State
    └── Cards de Campanhas
        ├── Status (Ativa/Próxima/Encerrada)
        ├── Progresso (se ativa)
        ├── Vencedores (se encerrada)
        └── Grid de Premiações
```

---

## ⚠️ 8. Observações Importantes

### Dados Reais:
- ✅ Rankings agora usa dados do PostgreSQL
- ✅ Inclui todos os contratos (não só "ativos")
- ✅ Usa fallback de datas (`created_at`, `signed_at`, `disbursed_at`)

### Campanhas:
- 🎭 Por enquanto em memória (não persiste ao reiniciar)
- 📝 Próximo passo: migrar para banco
- 🔒 RBAC aplicado (admin/supervisor)

### Performance:
- Queries otimizadas com OUTER JOIN
- Agregações no banco (não em Python)
- Query condicional de datas

---

## 🐛 9. Troubleshooting

### Rankings vazio?
1. Verifique se há contratos no banco:
   ```sql
   SELECT COUNT(*) FROM contracts;
   ```
2. Verifique se `Contract.consultoria_valor_liquido` está preenchido
3. Confirme que há `user_id` ou `created_by` nos contratos

### Campanha não aparece?
1. Reinicie o servidor (dados em memória se perdem)
2. Verifique resposta da API em `/campanhas`
3. Veja console do navegador por erros

### Modal não abre?
1. Confirme imports do Dialog (shadcn/ui)
2. Verifique estado `showNovaCampanhaModal`
3. Console do navegador

---

## ✅ 10. Checklist de Implementação

- [x] Remover filtro de status "ativo" nas queries
- [x] Adicionar fallback de datas (coalesce)
- [x] Usar OUTER JOIN para evitar perda de dados
- [x] Criar API de campanhas (CRUD completo)
- [x] Registrar router no main.py
- [x] Criar modal de nova campanha
- [x] Implementar formulário dinâmico de premiações
- [x] Integrar com React Query (mutations)
- [x] Adicionar toasts de feedback
- [x] Substituir mocks inline por API
- [x] Testar criação de campanha
- [x] Documentar alterações

---

**Status:** ✅ Completo e Funcional
**Data:** 2025-10-03
**Autor:** Claude Code

---
