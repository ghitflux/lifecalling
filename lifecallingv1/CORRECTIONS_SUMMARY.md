# Correções Necessárias - Sistema LifeCalling

## 1. Sistema de Comentários - Visibilidade entre Módulos

### Arquivo: `lifecalling/apps/web/src/components/case/CaseChat.tsx`

**Linha 43**: Trocar
```typescript
queryClient.invalidateQueries({ queryKey: ['comments', caseId] });
```

Por:
```typescript
queryClient.invalidateQueries({ queryKey: ['comments'] }); // Invalida todos os comentários
```

**Motivo**: A query usa `['comments', caseId, defaultChannel]` mas a invalidação usa apenas `['comments', caseId]`, fazendo com que comentários de outros canais não sejam atualizados.

---

## 2. Lista de Todas Simulações - Erro "map is not a function"

### Arquivo: `lifecalling/apps/web/src/app/calculista/page.tsx`

**Linha 225**: Trocar
```typescript
const dataToFilter = activeTab === "todas_simulacoes" ? allSimulationsQuery : allSimulations;
```

Por:
```typescript
const dataToFilter = activeTab === "todas_simulacoes" ? allSimulationsQuery : (allSimulations || []);
```

OU garantir que allSimulations seja array:
```typescript
const dataToFilter = activeTab === "todas_simulacoes" ? allSimulationsQuery : allSimulations;
// Garantir que é array
if (!Array.isArray(dataToFilter)) return [];
```

**Motivo**: `allSimulations` pode ser undefined ou não ser um array, causando erro no `.filter()`.

---

## 3. Status Changer - Não Atualiza Caso na Tela

### Arquivo: `lifecalling/apps/web/src/components/case/AdminStatusChanger.tsx`

**Linha 69-95**: Adicionar invalidação de mais queries

Após a linha 73, adicionar:
```typescript
queryClient.invalidateQueries({ queryKey: ['calculista'] });
queryClient.invalidateQueries({ queryKey: ['closing'] });
queryClient.invalidateQueries({ queryKey: ['finance'] });
queryClient.invalidateQueries({ queryKey: ['simulations'] });
```

**Motivo**: Quando o status muda, o caso precisa sair da fila atual e ir para outra, mas as queries específicas de cada módulo não estão sendo invalidadas.

---

## 4. Cálculo da Consultoria Líquida

### Verificar onde está sendo calculado

O cálculo correto é: `Consultoria Líquida = Consultoria - (14% da Consultoria)` ou `Consultoria * 0.86`

### Arquivos a verificar:
- `lifecalling/apps/web/src/app/casos/[id]/page.tsx:932`
- `lifecalling/apps/web/src/app/financeiro/page.tsx:787`
- `lifecalling/apps/web/src/app/fechamento/[id]/page.tsx:603`

Verificar se está usando:
```typescript
const consultoriaLiquida = consultoria * 0.86; // CORRETO
```

Ou:
```typescript
const consultoriaLiquida = consultoria - (consultoria * 0.14); // CORRETO
```

---

## 5. Botão "Ver Financiamentos" no Modal

### Arquivos a investigar:
- Modal de simulação/financiamento
- Provavelmente em `lifecalling/apps/web/src/app/casos/[id]/page.tsx` ou similar

**Ação**: Localizar o modal de financiamento e adicionar botão "Ver Financiamentos" logo abaixo da seção de anexos.

---

## 6. Ajuste de Cores e Contraste

### Problemas identificados:
- Fundos claros com textos claros
- Baixo contraste visual

### Ação:
- Identificar componentes com problemas de contraste
- Ajustar cores para garantir contraste mínimo de 4.5:1 (WCAG AA)
- Usar cores escuras em fundos claros e vice-versa

### Possíveis arquivos:
- AdminStatusChanger.tsx (linha 127 - bg-orange-50)
- StatusBadge components
- Card components com variantes
