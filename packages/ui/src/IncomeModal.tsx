/* packages/ui/src/IncomeModal.tsx */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";

import { FilterDropdown } from "./FilterDropdown";
import { cn } from "./lib/utils";
// local helper utilities (moved inline to avoid missing module)
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const parseCurrency = (input: string): number => {
  if (!input) return 0;

  // Remove todos os caracteres que não são dígitos
  const cleanValue = input.replace(/\D/g, '');

  if (!cleanValue) return 0;

  // Converte para número dividindo por 100 (centavos)
  const result = parseFloat(cleanValue) / 100;

  // Garante que o resultado é um número válido
  if (isNaN(result) || !isFinite(result)) {
    return 0;
  }

  return result;
};

const formatCurrencyInput = (input: string): string => {
  const digits = input.replace(/\D/g, '');
  const num = parseFloat(digits) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
import { DollarSign, Calendar, FileText, Paperclip, Download, X, User } from "lucide-react";

export interface IncomeData {
  id?: number;
  date: string;  // "YYYY-MM-DD"
  income_type: string;
  income_name?: string;
  amount: number;
  agent_user_id?: number;  // ID do atendente (obrigatório para "Consultoria Bruta")
  client_cpf?: string;  // CPF do cliente (obrigatório para "Consultoria Bruta")
  client_name?: string;  // Nome do cliente (obrigatório para "Consultoria Bruta")
  attachment_filename?: string;
  attachment_size?: number;
  has_attachment?: boolean;
}

export interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IncomeData, files?: File[]) => void;
  onDownloadAttachment?: (incomeId: number) => void;
  onDeleteAttachment?: (incomeId: number) => void;
  initialData?: IncomeData | null;
  loading?: boolean;
  availableUsers?: Array<{ id: number; name: string; role: string }>;
}

export function IncomeModal({
  isOpen,
  onClose,
  onSubmit,
  onDownloadAttachment,
  onDeleteAttachment,
  initialData,
  loading = false,
  availableUsers = []
}: IncomeModalProps) {
  const currentDate = new Date();
  const [formData, setFormData] = useState<IncomeData>({
    date: currentDate.toISOString().split('T')[0],
    income_type: "",
    income_name: "",
    amount: 0
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? initialData.date.split('T')[0] : currentDate.toISOString().split('T')[0]
      });
      setDisplayValue(formatCurrency(initialData.amount || 0));
    } else {
      setFormData({
        date: currentDate.toISOString().split('T')[0],
        income_type: "",
        income_name: "",
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

  const incomeTypes = [
    { value: "Receita Manual", label: "Receita Manual" },
    { value: "Consultoria Bruta", label: "Consultoria Bruta" },
    { value: "Bônus", label: "Bônus" },
    { value: "Comissão", label: "Comissão" },
    { value: "Serviços Extras", label: "Serviços Extras" },
    { value: "Investimentos", label: "Investimentos" },
    { value: "Parcerias", label: "Parcerias" },
    { value: "Outros", label: "Outros" }
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
            <label className="text-sm font-medium">Data da Receita</label>
            <Input
              type="date"
              value={formData.date || ""}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              disabled={loading}
              required
            />
          </div>

          {/* Tipo de Receita */}
          <FilterDropdown
            label="Tipo de Receita"
            options={incomeTypes}
            value={formData.income_type}
            onChange={(value) => setFormData({ ...formData, income_type: value as string })}
            disabled={loading}
            placeholder="Selecione o tipo..."
          />

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

          {/* Campos condicionais para "Consultoria Bruta" */}
          {formData.income_type === "Consultoria Bruta" && (
            <>
              {/* Atendente */}
              <div className="space-y-3 bg-amber-100 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
                <p className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Campos obrigatórios para Consultoria Bruta
                </p>

                {/* Atendente */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Atendente *
                  </label>
                  <select
                    value={formData.agent_user_id || ""}
                    onChange={(e) => setFormData({ ...formData, agent_user_id: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border rounded-md bg-white text-gray-900"
                    disabled={loading}
                    required
                  >
                    <option value="">Selecione o atendente...</option>
                    {availableUsers
                      .filter(u => u.role === "atendente")
                      .map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))
                    }
                  </select>
                </div>

                {/* CPF do Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">CPF do Cliente *</label>
                <Input
                  type="text"
                  value={formData.client_cpf || ""}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length > 11) value = value.slice(0, 11);
                    // Formatar CPF
                    if (value.length > 9) {
                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                    } else if (value.length > 6) {
                      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
                    } else if (value.length > 3) {
                      value = value.replace(/(\d{3})(\d{1,3})/, "$1.$2");
                    }
                    setFormData({ ...formData, client_cpf: value });
                  }}
                  placeholder="000.000.000-00"
                  disabled={loading}
                  required
                  maxLength={14}
                />
              </div>

                {/* Nome do Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Nome do Cliente *</label>
                  <Input
                    type="text"
                    className="bg-white text-gray-900"
                    value={formData.client_name || ""}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="Nome completo do cliente"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Valor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor da Receita
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
              Informe o valor individual desta receita (ex: R$ 2.500,00)
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
                "Salvar Receita"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
