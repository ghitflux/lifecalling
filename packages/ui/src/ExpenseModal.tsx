/* packages/ui/src/ExpenseModal.tsx */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "./lib/utils";
import { formatCurrency, parseCurrency, formatCurrencyInput, formatFileSize } from "./lib/currency";
import { DollarSign, Calendar, FileText, Paperclip, Download, X } from "lucide-react";

export interface ExpenseData {
  id?: number;
  date: string;  // "YYYY-MM-DD"
  expense_type: string;
  expense_name: string;
  amount: number;
  attachment_filename?: string;
  attachment_size?: number;
  has_attachment?: boolean;
}

export interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseData, files?: File[]) => void;
  onDownloadAttachment?: (expenseId: number) => void;
  onDeleteAttachment?: (expenseId: number) => void;
  initialData?: ExpenseData | null;
  loading?: boolean;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  onDownloadAttachment,
  onDeleteAttachment,
  initialData,
  loading = false
}: ExpenseModalProps) {
  const currentDate = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState<ExpenseData>({
    date: currentDate,
    expense_type: "",
    expense_name: "",
    amount: 0
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setDisplayValue(formatCurrency(initialData.amount || 0));
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        date: today,
        expense_type: "",
        expense_name: "",
        amount: 0
      });
      setDisplayValue("");
    }
    setSelectedFiles([]);
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, selectedFiles.length > 0 ? selectedFiles : undefined);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };



  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrencyInput(inputValue);
    const numericValue = parseCurrency(inputValue);
    
    setFormData({ ...formData, amount: numericValue });
    setDisplayValue(formattedValue);
  };

  const expenseTypes = [
    "Aluguel",
    "Salários",
    "Impostos",
    "Marketing",
    "Infraestrutura",
    "Manutenção",
    "Serviços",
    "Outros"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Despesa" : "Adicionar Despesa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data da Despesa
            </label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {/* Tipo de Despesa */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo de Despesa
            </label>
            <select
              value={formData.expense_type}
              onChange={(e) => setFormData({ ...formData, expense_type: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={loading}
              required
            >
              <option value="">Selecione...</option>
              {expenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Nome da Despesa */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Nome da Despesa
            </label>
            <Input
              type="text"
              value={formData.expense_name}
              onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
              placeholder="Ex: Aluguel do escritório central"
              disabled={loading}
              required
            />
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor da Despesa
            </label>
            <Input
              type="text"
              value={displayValue}
              onChange={handleAmountChange}
              placeholder="R$ 0,00"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Informe o valor individual desta despesa (ex: R$ 1.500,00)
            </p>
          </div>

          {/* Anexo */}
          <div className="space-y-2 pt-2 border-t">
            <label className="text-sm font-medium flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Anexo (Comprovante)
            </label>

            {/* Exibir anexo existente (somente ao editar) */}
            {initialData?.has_attachment && initialData?.id && (
              <div className="flex items-center justify-between p-2 rounded border bg-muted/50 mb-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{initialData.attachment_filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(initialData.attachment_size)}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {onDownloadAttachment && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onDownloadAttachment(initialData.id!)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteAttachment && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteAttachment(initialData.id!)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Campo de upload (sempre disponível) */}
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={loading}
              multiple
            />

            {/* Lista de arquivos selecionados */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Arquivos selecionados:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {initialData?.has_attachment
                ? "Selecione novos arquivos para adicionar aos anexos existentes"
                : "Formatos aceitos: PDF, JPG, PNG (máx. 10MB cada). Você pode selecionar múltiplos arquivos."}
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
