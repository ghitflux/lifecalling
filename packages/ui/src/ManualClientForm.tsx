"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./label";
import { X, Plus } from "lucide-react";

interface BankMatricula {
  banco_nome: string;
  matricula: string;
  valor_parcela: string;
  ref_month: number;
  ref_year: number;
}

interface ManualClientFormProps {
  onSubmit: (data: {
    nome: string;
    cpf: string;
    matriculas_bancos: BankMatricula[];
    assign_to_user_id: number | null;
  }) => Promise<void>;
  users?: Array<{ id: number; name: string }>;
  isAdmin?: boolean;
  isLoading?: boolean;
}

export function ManualClientForm({
  onSubmit,
  users = [],
  isAdmin = false,
  isLoading = false,
}: ManualClientFormProps) {
  const currentYear = new Date().getFullYear();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [assignToUserId, setAssignToUserId] = useState<number | null>(null);
  const [matriculas, setMatriculas] = useState<BankMatricula[]>([
    {
      banco_nome: "",
      matricula: "",
      valor_parcela: "",
      ref_month: new Date().getMonth() + 1,
      ref_year: currentYear,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCpfChange = (value: string) => {
    // Permitir apenas números
    const numericValue = value.replace(/\D/g, "");
    setCpf(numericValue);
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatMatricula = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 6) {
      return numericValue;
    }
    // Formato: 123456-7
    return `${numericValue.slice(0, 6)}-${numericValue.slice(6, 7)}`;
  };

  const handleMatriculaChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 7); // Max 7 dígitos
    const updated = [...matriculas];
    updated[index].matricula = numericValue;
    setMatriculas(updated);
  };

  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return "";
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleValorChange = (index: number, value: string) => {
    // Permitir apenas números e vírgula/ponto
    const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
    const updated = [...matriculas];
    updated[index].valor_parcela = normalized;
    setMatriculas(updated);
  };

  const addMatricula = () => {
    setMatriculas([
      ...matriculas,
      {
        banco_nome: "",
        matricula: "",
        valor_parcela: "",
        ref_month: new Date().getMonth() + 1,
        ref_year: currentYear,
      },
    ]);
  };

  const removeMatricula = (index: number) => {
    if (matriculas.length > 1) {
      setMatriculas(matriculas.filter((_, i) => i !== index));
    }
  };

  const updateMatricula = (
    index: number,
    field: keyof BankMatricula,
    value: string | number
  ) => {
    const updated = [...matriculas];
    updated[index] = { ...updated[index], [field]: value };
    setMatriculas(updated);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }

    // Validar CPF
    if (cpf.length !== 11) {
      newErrors.cpf = "CPF deve conter 11 dígitos";
    }

    // Validar matrículas
    matriculas.forEach((m, index) => {
      if (!m.banco_nome.trim()) {
        newErrors[`banco_${index}`] = "Nome do banco é obrigatório";
      }
      if (!m.matricula.trim()) {
        newErrors[`matricula_${index}`] = "Matrícula é obrigatória";
      }
      const valor = parseFloat(m.valor_parcela);
      if (isNaN(valor) || valor <= 0) {
        newErrors[`valor_${index}`] = "Valor inválido";
      }
      if (m.ref_month < 1 || m.ref_month > 12) {
        newErrors[`ref_month_${index}`] = "Mês inválido";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        nome: nome.trim(),
        cpf,
        matriculas_bancos: matriculas.map((m) => ({
          banco_nome: m.banco_nome.trim(),
          matricula: m.matricula.trim(),
          valor_parcela: parseFloat(m.valor_parcela).toString(), // Converter para string numérica limpa
          ref_month: m.ref_month,
          ref_year: m.ref_year,
        })),
        assign_to_user_id: assignToUserId,
      });
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome Cliente */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Cliente *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="João da Silva"
          disabled={isLoading}
        />
        {errors.nome && (
          <p className="text-sm text-red-600">{errors.nome}</p>
        )}
      </div>

      {/* CPF */}
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF *</Label>
        <Input
          id="cpf"
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          placeholder="12345678901"
          maxLength={11}
          disabled={isLoading}
        />
        {errors.cpf && <p className="text-sm text-red-600">{errors.cpf}</p>}
        {cpf && (
          <p className="text-xs text-muted-foreground">
            Formatado: {formatCPF(cpf)}
          </p>
        )}
      </div>

      {/* Matrículas e Bancos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Matrículas e Bancos *
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMatricula}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Matrícula
          </Button>
        </div>

        {matriculas.map((m, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 space-y-3 relative"
          >
            {matriculas.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeMatricula(index)}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}

            <div className="font-medium text-sm text-muted-foreground">
              Matrícula #{index + 1}
            </div>

            {/* Matrícula */}
            <div className="space-y-1">
              <Label htmlFor={`matricula_${index}`}>Matrícula (7 dígitos) *</Label>
              <Input
                id={`matricula_${index}`}
                value={m.matricula}
                onChange={(e) => handleMatriculaChange(index, e.target.value)}
                placeholder="1234567"
                maxLength={7}
                disabled={isLoading}
              />
              {m.matricula && m.matricula.length === 7 && (
                <p className="text-xs text-muted-foreground">
                  Formatado: {formatMatricula(m.matricula)}
                </p>
              )}
              {errors[`matricula_${index}`] && (
                <p className="text-sm text-red-600">
                  {errors[`matricula_${index}`]}
                </p>
              )}
            </div>

            {/* Nome do Banco */}
            <div className="space-y-1">
              <Label htmlFor={`banco_${index}`}>Nome do Banco *</Label>
              <Input
                id={`banco_${index}`}
                value={m.banco_nome}
                onChange={(e) =>
                  updateMatricula(index, "banco_nome", e.target.value)
                }
                placeholder="Banco do Brasil"
                disabled={isLoading}
              />
              {errors[`banco_${index}`] && (
                <p className="text-sm text-red-600">
                  {errors[`banco_${index}`]}
                </p>
              )}
            </div>

            {/* Valor da Parcela */}
            <div className="space-y-1">
              <Label htmlFor={`valor_${index}`}>Valor da Parcela *</Label>
              <Input
                id={`valor_${index}`}
                value={m.valor_parcela}
                onChange={(e) => handleValorChange(index, e.target.value)}
                placeholder="500.00"
                disabled={isLoading}
              />
              {m.valor_parcela && parseFloat(m.valor_parcela) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Formatado: {formatCurrency(m.valor_parcela)}
                </p>
              )}
              {errors[`valor_${index}`] && (
                <p className="text-sm text-red-600">
                  {errors[`valor_${index}`]}
                </p>
              )}
            </div>

            {/* Mês e Ano de Referência */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor={`ref_month_${index}`}>Mês Ref. *</Label>
                <select
                  id={`ref_month_${index}`}
                  value={m.ref_month}
                  onChange={(e) =>
                    updateMatricula(
                      index,
                      "ref_month",
                      parseInt(e.target.value)
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={isLoading}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor={`ref_year_${index}`}>Ano Ref. *</Label>
                <Input
                  id={`ref_year_${index}`}
                  type="number"
                  value={m.ref_year}
                  onChange={(e) =>
                    updateMatricula(
                      index,
                      "ref_year",
                      parseInt(e.target.value)
                    )
                  }
                  min={2020}
                  max={2099}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Atribuir a Usuário (apenas admin/supervisor) */}
      {isAdmin && users.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assign_to">Atribuir Caso a Usuário (Opcional)</Label>
          <select
            id="assign_to"
            value={assignToUserId || ""}
            onChange={(e) =>
              setAssignToUserId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLoading}
          >
            <option value="">Não atribuir automaticamente</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar Cliente"}
        </Button>
      </div>
    </form>
  );
}
