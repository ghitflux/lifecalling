/* packages/ui/src/IncomeModal.tsx */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "./lib/utils";
import { DollarSign, Calendar, FileText } from "lucide-react";

export interface IncomeData {
  id?: number;
  date: string;  // "YYYY-MM-DD"
  income_type: string;
  income_name?: string;
  amount: number;
}

export interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IncomeData) => void;
  initialData?: IncomeData | null;
  loading?: boolean;
}

export function IncomeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: IncomeModalProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState<IncomeData>({
    date: currentDate.toISOString().split('T')[0],
    income_type: "",
    income_name: "",
    amount: 0
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? initialData.date.split('T')[0] : currentDate.toISOString().split('T')[0]
      });
    } else {
      setFormData({
        date: currentDate.toISOString().split('T')[0],
        income_type: "",
        income_name: "",
        amount: 0
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const incomeTypes = [
    "Receita Manual",
    "Bônus",
    "Comissão",
    "Serviços Extras",
    "Investimentos",
    "Parcerias",
    "Outros"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Receita" : "Adicionar Receita"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data da Receita
            </label>
            <Input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {/* Tipo de Receita */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Receita
            </label>
            <select
              value={formData.income_type}
              onChange={(e) => setFormData({ ...formData, income_type: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
              required
            >
              <option value="">Selecione...</option>
              {incomeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Nome da Receita */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Nome da Receita
            </label>
            <Input
              type="text"
              value={formData.income_name || ""}
              onChange={(e) => setFormData({ ...formData, income_name: e.target.value })}
              placeholder="Ex: Bônus de desempenho trimestral"
              disabled={loading}
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor da Receita
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
              Informe o valor individual desta receita
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
                "Salvar Receita"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
