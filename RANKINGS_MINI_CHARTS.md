# 📊 Rankings com Mini Gráficos e Dados Mockados

## Data: 2025-10-03

---

## 📋 Implementação

Adicionei mini gráficos nos KPI cards do módulo Rankings e reativei dados mockados para demonstração.

---

## ✅ Alterações Realizadas

### 1. **Reativação de Dados Mockados**

**Arquivo:** `apps/api/app/routers/rankings_mock_config.py`

```python
# ANTES
USE_MOCK_DATA = False  # DESATIVADO

# DEPOIS
USE_MOCK_DATA = True  # ATIVADO - Dados mockados para demonstração
```

**Resultado:**
- ✅ Rankings agora exibe 10 atendentes mockados
- ✅ Dados sempre disponíveis (não depende do banco)
- ✅ Perfeito para demonstrações

---

### 2. **Atualização do KPICard com Suporte a Mini Gráficos**

**Arquivo:** `packages/ui/src/KPICard.tsx`

#### Novo Prop: `miniChart`

```tsx
interface KPICardProps {
  // ... props existentes
  miniChart?: React.ReactNode;  // ← NOVO
}
```

#### Renderização do Mini Chart

```tsx
{/* Mini Chart */}
{miniChart && (
  <div className="mt-4 -mb-2 -mx-2">
    {miniChart}
  </div>
)}
```

**Features:**
- ✅ Mini chart opcional
- ✅ Substitui ícone quando presente
- ✅ Espaçamento negativo para ocupar toda largura
- ✅ Compatível com gráficos Recharts

---

### 3. **Dados Mockados de Tendência**

**Arquivo:** `apps/web/src/app/rankings/page.tsx`

#### Dados dos Últimos 7 Dias

```tsx
const MOCK_TREND_DATA = {
  contratos: [
    { day: "D1", value: 0 },
    { day: "D2", value: 1 },
    { day: "D3", value: 1 },
    { day: "D4", value: 2 },
    { day: "D5", value: 3 },
    { day: "D6", value: 5 },
    { day: "D7", value: 7 }
  ],
  consultoria: [
    { day: "D1", value: 0 },
    { day: "D2", value: 2500 },
    { day: "D3", value: 3200 },
    { day: "D4", value: 4100 },
    { day: "D5", value: 5800 },
    { day: "D6", value: 7200 },
    { day: "D7", value: 9500 }
  ]
};
```

**Padrão:**
- Crescimento gradual
- 7 pontos de dados (última semana)
- Valores realistas

---

### 4. **Integração nos KPI Cards**

#### Card 1: Meus Contratos

```tsx
<KPICard
  title="Meus contratos"
  value={me?.contracts ?? 0}
  gradientVariant="emerald"
  subtitle="Total no período"
  trend={12.5}  // 12.5% de crescimento
  miniChart={
    <MiniAreaChart
      data={MOCK_TREND_DATA.contratos}
      dataKey="value"
      xKey="day"
      stroke="#10b981"  // Verde esmeralda
      height={80}
    />
  }
/>
```

#### Card 2: Minha Consultoria Líquida

```tsx
<KPICard
  title="Minha consultoria líquida"
  value={`R$ ${(me?.consultoria_liq ?? 0).toLocaleString('pt-BR')}`}
  gradientVariant="violet"
  subtitle={`Meta: R$ 10.000/mês`}
  trend={18.7}  // 18.7% de crescimento
  miniChart={
    <MiniAreaChart
      data={MOCK_TREND_DATA.consultoria}
      dataKey="value"
      xKey="day"
      stroke="#8b5cf6"  // Roxo violeta
      height={80}
      tooltipFormatter={(value) =>
        `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      }
    />
  }
/>
```

**Cores por Gradiente:**
- Emerald (verde): `#10b981`
- Violet (roxo): `#8b5cf6`
- Sky (azul): `#38bdf8`
- Rose (vermelho): `#f43f5e`
- Amber (amarelo): `#f59e0b`

---

## 🎨 5. Componente MiniAreaChart

**Já existente em:** `packages/ui/src/MiniAreaChart.tsx`

### Features:

1. **Responsive:** Adapta ao container
2. **Gradiente:** Área com degradê
3. **Tooltip:** Customizável
4. **Animação:** Suave (600ms)
5. **Sem Eixos:** Visual limpo
6. **Stroke Customizável:** Qualquer cor

### Props:

```tsx
interface MiniAreaChartProps {
  data: Array<Record<string, any>>;  // Dados do gráfico
  dataKey: string;                    // Chave do valor (ex: "value")
  xKey: string;                       // Chave do eixo X (ex: "day")
  stroke?: string;                    // Cor da linha
  height?: number;                    // Altura em pixels
  className?: string;                 // Classes CSS
  tooltipFormatter?: (value: number) => string;  // Formatar tooltip
}
```

### Exemplo de Uso:

```tsx
<MiniAreaChart
  data={[
    { month: "Jan", sales: 100 },
    { month: "Feb", sales: 150 },
    { month: "Mar", sales: 200 }
  ]}
  dataKey="sales"
  xKey="month"
  stroke="#10b981"
  height={96}
  tooltipFormatter={(v) => `$${v}`}
/>
```

---

## 📊 6. Visualização Final

### KPI Cards com Mini Gráficos:

```
┌─────────────────────────────────────┐
│ Meus contratos                      │
│                                     │
│ 45                    12.5% ↑      │
│ Total no período                    │
│                                     │
│ ╱╲  ╱╲    ╱╲╱                     │ ← Mini gráfico
│╱  ╲╱  ╲  ╱    ╲                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Minha consultoria líquida           │
│                                     │
│ R$ 125.000,50         18.7% ↑      │
│ Meta: R$ 10.000/mês                │
│                                     │
│   ╱╲    ╱╲╱                       │ ← Mini gráfico
│  ╱  ╲  ╱    ╲                     │
│ ╱    ╲╱      ╲                    │
└─────────────────────────────────────┘
```

---

## 🚀 7. Benefícios

### Para o Usuário:
- ✅ **Contexto Visual**: Vê a tendência de forma rápida
- ✅ **Dados Históricos**: Últimos 7 dias em um relance
- ✅ **Engajamento**: Visual mais atrativo
- ✅ **Decisões**: Tendência ajuda a entender performance

### Para o Sistema:
- ✅ **Reutilizável**: MiniAreaChart pode ser usado em qualquer lugar
- ✅ **Performático**: Componente leve
- ✅ **Customizável**: Cores, altura, formatação
- ✅ **Acessível**: Tooltip informativo

---

## 📂 8. Arquivos Modificados

### Backend (1 arquivo):
1. ✏️ `apps/api/app/routers/rankings_mock_config.py` - Reativado mocks

### Frontend/UI (2 arquivos):
2. ✏️ `packages/ui/src/KPICard.tsx` - Adicionado suporte a miniChart
3. ✏️ `apps/web/src/app/rankings/page.tsx` - Integração dos mini charts

### Documentação (1 arquivo):
4. 📄 `RANKINGS_MINI_CHARTS.md` - Este documento

---

## 🎯 9. Como Usar em Outros Módulos

### Exemplo: Dashboard

```tsx
import { KPICard, MiniAreaChart } from "@lifecalling/ui";

const trendData = [
  { day: "Seg", value: 10 },
  { day: "Ter", value: 15 },
  { day: "Qua", value: 12 },
  { day: "Qui", value: 18 },
  { day: "Sex", value: 25 }
];

<KPICard
  title="Vendas"
  value="R$ 45.000"
  gradientVariant="emerald"
  trend={15.3}
  miniChart={
    <MiniAreaChart
      data={trendData}
      dataKey="value"
      xKey="day"
      stroke="#10b981"
      height={80}
    />
  }
/>
```

### Exemplo: Financeiro

```tsx
const expensesTrend = [
  { week: "S1", amount: 5000 },
  { week: "S2", amount: 5500 },
  { week: "S3", amount: 4800 },
  { week: "S4", amount: 6200 }
];

<KPICard
  title="Despesas do Mês"
  value="R$ 21.500"
  gradientVariant="rose"
  trend={-5.2}
  miniChart={
    <MiniAreaChart
      data={expensesTrend}
      dataKey="amount"
      xKey="week"
      stroke="#f43f5e"
      height={80}
      tooltipFormatter={(v) => `R$ ${v.toLocaleString()}`}
    />
  }
/>
```

---

## 🔄 10. Próximos Passos

### Curto Prazo:
1. **Dados Reais de Tendência**
   - Endpoint `/rankings/agents/{id}/trend`
   - Últimos 7 ou 30 dias
   - Calcular no backend

2. **MiniBarChart**
   - Criar variante com barras
   - Útil para comparações discretas

3. **Cores Dinâmicas**
   - Verde se tendência positiva
   - Vermelho se negativa

### Médio Prazo:
4. **Período Customizável**
   - Usuário escolhe: 7d, 30d, 90d
   - Dropdown no card

5. **Mais Métricas**
   - Taxa de conversão
   - Ticket médio
   - SLA

6. **Comparação**
   - Período anterior (linha pontilhada)
   - Média do time

### Longo Prazo:
7. **Drill-Down**
   - Clicar no mini chart abre detalhes
   - Modal com gráfico maior

8. **Exportação**
   - Download PNG do gráfico
   - CSV dos dados

---

## 💡 11. Dicas de UX

### Cores Semânticas:
- 🟢 **Verde** (`#10b981`): Receitas, vendas, crescimento positivo
- 🔵 **Azul** (`#38bdf8`): Neutro, informativo, usuários
- 🟣 **Roxo** (`#8b5cf6`): Premium, destaque, metas
- 🔴 **Vermelho** (`#f43f5e`): Despesas, alertas, queda
- 🟡 **Amarelo** (`#f59e0b`): Atenção, pendente, moderado

### Alturas Recomendadas:
- **Cards pequenos**: 60-80px
- **Cards médios**: 96-120px
- **Cards grandes**: 150-200px

### Tooltips:
- Sempre formatar valores monetários
- Usar locale brasileiro (`pt-BR`)
- Incluir unidade (R$, %, un.)

---

## 📊 12. Dados de Exemplo

### Crescimento Linear:
```tsx
[
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 30 },
  { x: 4, y: 40 },
  { x: 5, y: 50 }
]
```

### Crescimento Exponencial:
```tsx
[
  { x: 1, y: 10 },
  { x: 2, y: 15 },
  { x: 3, y: 25 },
  { x: 4, y: 45 },
  { x: 5, y: 80 }
]
```

### Flutuação:
```tsx
[
  { x: 1, y: 100 },
  { x: 2, y: 120 },
  { x: 3, y: 90 },
  { x: 4, y: 110 },
  { x: 5, y: 95 },
  { x: 6, y: 130 }
]
```

---

## ✅ 13. Checklist de Implementação

- [x] Reativar dados mockados no rankings
- [x] Adicionar prop `miniChart` ao KPICard
- [x] Criar dados mockados de tendência (7 dias)
- [x] Integrar MiniAreaChart nos cards
- [x] Configurar cores por gradiente
- [x] Adicionar tooltips formatados
- [x] Ajustar altura dos gráficos (80px)
- [x] Testar responsividade
- [x] Documentar implementação

---

**Status:** ✅ Completo e Funcional
**Data:** 2025-10-03
**Autor:** Claude Code

---
