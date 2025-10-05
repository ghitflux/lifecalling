# Correções Pendentes - Módulo Financeiro

## Correções Já Implementadas ✅

1. **Data vazia no ExpenseModal** - Corrigido formato de data
2. **Emoji com encoding incorreto** - Corrigido "✨"

## Correções Pendentes (Por Prioridade)

### CRÍTICA

#### 1. Corrigir data no IncomeModal
**Arquivo**: `packages/ui/src/IncomeModal.tsx` (linha ~95-115)
**Código atual**:
```typescript
useEffect(() => {
  if (initialData) {
    setFormData({
      date: initialData.date || "",
      // ...
    });
```

**Código correto**:
```typescript
useEffect(() => {
  if (initialData) {
    const formattedDate = initialData.date?.includes('T')
      ? initialData.date.split('T')[0]
      : initialData.date;

    setFormData({
      date: formattedDate || new Date().toISOString().split('T')[0],
      // ...
    });
```

#### 2. Anexos não aparecem ao editar
**Problema**: Campo `has_attachment` retorna da API mas não exibe anexo existente

**Arquivos**: `ExpenseModal.tsx` e `IncomeModal.tsx`

**Adicionar no useEffect**:
```typescript
// Buscar anexos se existirem
if (initialData && initialData.has_attachment) {
  // Exibir nome do arquivo: initialData.attachment_filename
  // Exibir tamanho: initialData.attachment_size
}
```

**Adicionar seção de anexos existentes após lista de novos arquivos**:
```tsx
{initialData?.has_attachment && (
  <div className="border rounded p-2">
    <p className="text-sm font-medium">Anexo Atual:</p>
    <div className="flex items-center justify-between">
      <span className="text-sm">{initialData.attachment_filename}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onDownloadAttachment(initialData.id)}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  </div>
)}
```

#### 3. Corrigir textos com encoding

**Arquivos a corrigir**:

`apps/web/src/app/atendimento/page.tsx`:
- Buscar: "Ã"rgÃ£o"
- Substituir por: "Órgão"

Buscar globalmente por padrões de encoding incorreto:
```bash
grep -r "Ã\|â\|Â\|¢\|€" apps/web/src --include="*.tsx"
```

### ALTA

#### 4. Criar Helper de Timezone Brasília

**Criar arquivo**: `apps/web/src/lib/timezone.ts`

```typescript
// Helper para converter datas para horário de Brasília
export const toBrasiliaTime = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;

  // Converter para horário de Brasília (UTC-3)
  const brasiliaOffset = -3 * 60; // minutos
  const localOffset = d.getTimezoneOffset();
  const diff = brasiliaOffset - localOffset;

  return new Date(d.getTime() + diff * 60 * 1000);
};

export const formatDateBrasilia = (date: Date | string): string => {
  const d = toBrasiliaTime(date);
  return d.toISOString().split('T')[0];
};

export const startOfDayBrasilia = (date: Date | string): Date => {
  const d = toBrasiliaTime(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

export const endOfDayBrasilia = (date: Date | string): Date => {
  const d = toBrasiliaTime(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
};
```

**Aplicar em**:
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/financeiro/page.tsx`
- `apps/web/src/app/rankings/page.tsx`

#### 5. Corrigir filtros rápidos de mês nos KPIs

**Arquivo**: `apps/web/src/app/financeiro/page.tsx`

**Verificar função** `handleMonthFilter` (linha ~150):
```typescript
const handleMonthFilter = (month: string) => {
  setSelectedMonth(month);
  setShowCustomDateFilter(false);
  // Garantir que start_date e end_date sejam calculados corretamente
};
```

**Verificar** `generateMonthFilters()` retorna meses corretos do ano atual.

#### 6. Corrigir exportação

**Arquivo**: `apps/web/src/app/financeiro/page.tsx` (linha ~567)

**Adicionar tratamento de erro**:
```typescript
const handleExportReport = async () => {
  try {
    const params = new URLSearchParams();
    // ... código atual ...

    const url = `${api.defaults.baseURL}/finance/export?${params.toString()}`;

    // Melhor: fazer requisição e baixar arquivo
    const response = await api.get('/finance/export', {
      params: Object.fromEntries(params),
      responseType: 'blob'
    });

    // Criar link de download
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `financeiro_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  } catch (error) {
    console.error('Erro ao exportar:', error);
    toast.error("Erro ao exportar relatório");
  }
};
```

### MÉDIA

#### 7. Implementar filtros por categoria

**Arquivo**: `apps/web/src/app/financeiro/page.tsx`

**Adicionar após linha 799** (após filtros de mês):
```tsx
{/* Filtros por Categoria */}
<div className="space-y-3 mt-4">
  <h4 className="text-sm font-medium">Filtrar por Categoria</h4>
  <div className="flex flex-wrap gap-2">
    <Button
      variant={selectedCategory === "" ? "default" : "outline"}
      size="sm"
      onClick={() => setSelectedCategory("")}
    >
      Todas
    </Button>
    {categories.expense_types.map((cat) => (
      <Button
        key={cat}
        variant={selectedCategory === cat ? "default" : "outline"}
        size="sm"
        onClick={() => setSelectedCategory(cat)}
      >
        {cat}
      </Button>
    ))}
  </div>
</div>
```

#### 8. Criar filtro de ordenação

**Adicionar state**:
```typescript
const [orderBy, setOrderBy] = useState<string>("date-desc");
```

**Adicionar FilterDropdown** (após filtros de categoria):
```tsx
<FilterDropdown
  label="Ordenar por"
  options={[
    { value: "date-desc", label: "Data (Mais recente)" },
    { value: "date-asc", label: "Data (Mais antiga)" },
    { value: "amount-desc", label: "Valor (Maior)" },
    { value: "amount-asc", label: "Valor (Menor)" },
    { value: "name-asc", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" }
  ]}
  value={orderBy}
  onChange={setOrderBy}
  wrapperClassName="w-64"
/>
```

**Aplicar ordenação**:
```typescript
const sortedTransactions = useMemo(() => {
  const [field, direction] = orderBy.split('-');

  return [...transactions].sort((a, b) => {
    let comparison = 0;

    if (field === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (field === 'amount') {
      comparison = a.amount - b.amount;
    } else if (field === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    }

    return direction === 'desc' ? -comparison : comparison;
  });
}, [transactions, orderBy]);
```

#### 9. Modal de visualização de detalhes

**Criar arquivo**: `packages/ui/src/TransactionDetailModal.tsx`

```typescript
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { Download } from "lucide-react";

export interface TransactionDetailProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  onDownloadAttachment?: (id: number) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailProps> = ({
  isOpen,
  onClose,
  transaction,
  onDownloadAttachment
}) => {
  if (!transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Detalhes da {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data */}
          <div>
            <label className="text-sm text-muted-foreground">Data</label>
            <p className="font-medium">{new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
          </div>

          {/* Tipo */}
          <div>
            <label className="text-sm text-muted-foreground">Tipo</label>
            <p className="font-medium">{transaction.type === 'receita' ? transaction.income_type : transaction.expense_type}</p>
          </div>

          {/* Nome */}
          <div>
            <label className="text-sm text-muted-foreground">Nome</label>
            <p className="font-medium">{transaction.name}</p>
          </div>

          {/* Valor */}
          <div>
            <label className="text-sm text-muted-foreground">Valor</label>
            <p className="text-2xl font-bold text-primary">
              R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Anexo */}
          {transaction.has_attachment && (
            <div className="border rounded-lg p-4">
              <label className="text-sm text-muted-foreground">Anexo</label>
              <div className="flex items-center justify-between mt-2">
                <span>{transaction.attachment_filename}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDownloadAttachment?.(transaction.id)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Exportar em** `packages/ui/index.ts`:
```typescript
export * from "./src/TransactionDetailModal";
```

#### 10. Botão "Ver Caso Completo" abrir modal

**Arquivo**: `apps/web/src/app/financeiro/page.tsx`

**Adicionar state**:
```typescript
const [selectedCase, setSelectedCase] = useState<any>(null);
const [showCaseModal, setShowCaseModal] = useState(false);
```

**Modificar handler** (linha ~950):
```typescript
const handleViewCase = async (caseId: number) => {
  try {
    const response = await api.get(`/cases/${caseId}`);
    setSelectedCase(response.data);
    setShowCaseModal(true);
  } catch (error) {
    toast.error("Erro ao carregar detalhes do caso");
  }
};
```

**Adicionar modal** (antes do return final):
```tsx
{/* Modal de Detalhes do Caso */}
{showCaseModal && selectedCase && (
  <Dialog open={showCaseModal} onOpenChange={() => setShowCaseModal(false)}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Detalhes do Caso #{selectedCase.id}</DialogTitle>
      </DialogHeader>
      {/* Reutilizar componente de detalhes do fechamento */}
      <CaseDetails case={selectedCase} />
    </DialogContent>
  </Dialog>
)}
```

## Resumo

### Já Corrigido ✅
- Data vazia no ExpenseModal
- Texto "✨ Nenhum"

### Crítico (implementar primeiro)
- Data vazia no IncomeModal
- Anexos não persistindo
- Textos com encoding
- Helper timezone Brasília
- Filtros rápidos mês
- Exportação

### Importante (implementar depois)
- Filtros por categoria
- Filtro de ordenação
- Modal de detalhes
- Ver Caso Completo modal

---
Documento criado em: 2025-10-04
