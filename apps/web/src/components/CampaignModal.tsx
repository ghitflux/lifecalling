"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Premiacao {
  posicao: string;
  premio: string;
}

interface CampaignData {
  id?: number;
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  premiacoes: Premiacao[];
}

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CampaignData) => void;
  initialData?: CampaignData | null;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

const STATUS_OPTIONS = [
  { value: "proxima", label: "🔵 Próxima" },
  { value: "ativa", label: "🟢 Ativa" },
  { value: "encerrada", label: "⚫ Encerrada" },
];

const DEFAULT_PREMIACOES: Premiacao[] = [
  { posicao: "1º Lugar", premio: "" },
  { posicao: "2º Lugar", premio: "" },
  { posicao: "3º Lugar", premio: "" },
];

export function CampaignModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
  mode = "create",
}: CampaignModalProps) {
  const [formData, setFormData] = useState<CampaignData>({
    nome: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    status: "proxima",
    premiacoes: DEFAULT_PREMIACOES,
  });

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          ...initialData,
          premiacoes: initialData.premiacoes.length > 0 ? initialData.premiacoes : DEFAULT_PREMIACOES,
        });
      } else {
        setFormData({
          nome: "",
          descricao: "",
          data_inicio: "",
          data_fim: "",
          status: "proxima",
          premiacoes: DEFAULT_PREMIACOES,
        });
      }
    }
  }, [open, initialData]);

  const handleInputChange = (field: keyof CampaignData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePremiacaoChange = (index: number, field: keyof Premiacao, value: string) => {
    setFormData(prev => ({
      ...prev,
      premiacoes: prev.premiacoes.map((premiacao, i) =>
        i === index ? { ...premiacao, [field]: value } : premiacao
      ),
    }));
  };

  const adicionarPremiacao = () => {
    setFormData(prev => ({
      ...prev,
      premiacoes: [...prev.premiacoes, { posicao: "", premio: "" }],
    }));
  };

  const removerPremiacao = (index: number) => {
    if (formData.premiacoes.length <= 1) {
      toast.error("Deve haver pelo menos uma premiação");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      premiacoes: prev.premiacoes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    // Validações
    if (!formData.nome.trim()) {
      toast.error("Nome da campanha é obrigatório");
      return;
    }

    if (!formData.descricao.trim()) {
      toast.error("Descrição da campanha é obrigatória");
      return;
    }

    if (!formData.data_inicio) {
      toast.error("Data de início é obrigatória");
      return;
    }

    if (!formData.data_fim) {
      toast.error("Data de fim é obrigatória");
      return;
    }

    // Validar se data de fim é posterior à data de início
    if (new Date(formData.data_fim) <= new Date(formData.data_inicio)) {
      toast.error("Data de fim deve ser posterior à data de início");
      return;
    }

    // Validar premiações
    const premiacoesValidas = formData.premiacoes.filter(
      p => p.posicao.trim() !== "" && p.premio.trim() !== ""
    );

    if (premiacoesValidas.length === 0) {
      toast.error("Adicione pelo menos uma premiação válida");
      return;
    }

    // Submeter dados
    onSubmit({
      ...formData,
      premiacoes: premiacoesValidas,
    });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nova Campanha" : "Editar Campanha"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Crie uma nova campanha de vendas com premiações personalizadas."
              : "Edite os dados da campanha selecionada."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Campanha *</Label>
              <Input
                id="nome"
                placeholder="Ex: Campanha Dezembro 2024"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva os objetivos e regras da campanha..."
                value={formData.descricao}
                onChange={(e) => handleInputChange("descricao", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formatDateForInput(formData.data_inicio)}
                    onChange={(e) => handleInputChange("data_inicio", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Fim *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="data_fim"
                    type="date"
                    value={formatDateForInput(formData.data_fim)}
                    onChange={(e) => handleInputChange("data_fim", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Premiações */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Premiações *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarPremiacao}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Premiação
              </Button>
            </div>

            <div className="space-y-3">
              {formData.premiacoes.map((premiacao, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`posicao-${index}`}>Posição</Label>
                    <Input
                      id={`posicao-${index}`}
                      placeholder="Ex: 1º Lugar"
                      value={premiacao.posicao}
                      onChange={(e) => handlePremiacaoChange(index, "posicao", e.target.value)}
                    />
                  </div>
                  <div className="flex-2 space-y-2">
                    <Label htmlFor={`premio-${index}`}>Prêmio</Label>
                    <Input
                      id={`premio-${index}`}
                      placeholder="Ex: R$ 1.000 + Smartphone"
                      value={premiacao.premio}
                      onChange={(e) => handlePremiacaoChange(index, "premio", e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removerPremiacao(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={formData.premiacoes.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : mode === "create" ? "Criar Campanha" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}