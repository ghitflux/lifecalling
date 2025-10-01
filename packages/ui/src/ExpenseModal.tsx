/* packages/ui/src/ExpenseModal.tsx */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, FileText } from "lucide-react";

export interface ExpenseData {
  id?: number;
  month: number;
  year: number;
  amount: number;
  description?: string;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseData) => void;
  initialData?: ExpenseData | null;
  loading?: boolean;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: ExpenseModalProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState<ExpenseData>({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    amount: 0,
    description: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        amount: 0,
        description: ""
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Despesa Mensal" : "Adicionar Despesa Mensal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Mês e Ano */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Mês
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
                required
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Ano
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={loading}
                required
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor Total de Despesas
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0,00"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Informe o valor total de todas as despesas do mês
            </p>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição (Opcional)
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhamento das despesas..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Detalhe as principais despesas do mês
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Despesa"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
