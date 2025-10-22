"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./label";
import { Upload, FileText } from "lucide-react";

interface PayrollClientData {
  // Dados do funcionário
  matricula: string;
  nome: string;
  cargo: string;
  cpf: string;
  
  // Dados do financiamento
  fin_code: string;
  orgao: string;
  total_parcelas: number;
  parcelas_pagas: number;
  valor_parcela: number;
  orgao_pgto: string;
  
  // Dados da entidade
  entidade_codigo: string;
  entidade_nome: string;
  ref_month: number;
  ref_year: number;
  data_geracao: string;
  
  // Anexo
  attachment_base64?: string;
  attachment_filename?: string;
}

interface PayrollClientFormProps {
  onSubmit: (data: PayrollClientData) => Promise<void>;
  isLoading?: boolean;
}

export function PayrollClientForm({
  onSubmit,
  isLoading = false,
}: PayrollClientFormProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Estados do formulário baseado no modelo TXT
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [cpf, setCpf] = useState("");
  
  const [finCode, setFinCode] = useState("");
  const [orgao, setOrgao] = useState("");
  const [totalParcelas, setTotalParcelas] = useState<number>(96);
  const [parcelasPagas, setParcelasPagas] = useState<number>(0);
  const [valorParcela, setValorParcela] = useState("");
  const [orgaoPgto, setOrgaoPgto] = useState("000");
  
  const [entidadeCodigo, setEntidadeCodigo] = useState("");
  const [entidadeNome, setEntidadeNome] = useState("");
  const [refMonth, setRefMonth] = useState<number>(currentMonth);
  const [refYear, setRefYear] = useState<number>(currentYear);
  
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formatadores
  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 11) {
      return numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return numericValue.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatMatricula = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue.length <= 6) {
      return numericValue;
    }
    return `${numericValue.substring(0, 6)}-${numericValue.substring(6, 7)}`;
  };

  const formatCurrency = (value: string) => {
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(numericValue)) return "";
    return numericValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Handlers
  const handleCpfChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setCpf(numericValue);
  };

  const handleMatriculaChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 7);
    setMatricula(numericValue);
  };

  const handleValorChange = (value: string) => {
    const normalized = value.replace(/[^\d.,]/g, "").replace(",", ".");
    setValorParcela(normalized);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
    }
  };

  // Validações
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (cpf.length !== 11) newErrors.cpf = "CPF deve ter 11 dígitos";
    if (matricula.length !== 7) newErrors.matricula = "Matrícula deve ter 7 dígitos";
    if (!cargo.trim()) newErrors.cargo = "Cargo é obrigatório";
    if (!finCode.trim()) newErrors.finCode = "Código FIN é obrigatório";
    if (!orgao.trim()) newErrors.orgao = "Órgão é obrigatório";
    if (totalParcelas <= 0) newErrors.totalParcelas = "Total de parcelas deve ser maior que 0";
    if (parcelasPagas < 0) newErrors.parcelasPagas = "Parcelas pagas não pode ser negativo";
    if (!valorParcela || parseFloat(valorParcela) <= 0) newErrors.valorParcela = "Valor da parcela é obrigatório";
    if (!entidadeCodigo.trim()) newErrors.entidadeCodigo = "Código da entidade é obrigatório";
    if (!entidadeNome.trim()) newErrors.entidadeNome = "Nome da entidade é obrigatório";
    if (refMonth < 1 || refMonth > 12) newErrors.refMonth = "Mês inválido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    // Processar anexo se fornecido
    let attachmentBase64 = "";
    let attachmentFilename = "";
    
    if (attachmentFile) {
      const reader = new FileReader();
      attachmentBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:type;base64,
        };
        reader.readAsDataURL(attachmentFile);
      });
      attachmentFilename = attachmentFile.name;
    }

    try {
      await onSubmit({
        matricula: formatMatricula(matricula),
        nome: nome.trim(),
        cargo: cargo.trim(),
        cpf,
        fin_code: finCode.trim(),
        orgao: orgao.trim(),
        total_parcelas: totalParcelas,
        parcelas_pagas: parcelasPagas,
        valor_parcela: parseFloat(valorParcela),
        orgao_pgto: orgaoPgto,
        entidade_codigo: entidadeCodigo.trim(),
        entidade_nome: entidadeNome.trim(),
        ref_month: refMonth,
        ref_year: refYear,
        data_geracao: new Date().toISOString(),
        attachment_base64: attachmentBase64 || undefined,
        attachment_filename: attachmentFilename || undefined,
      });
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          Cadastro Manual - Modelo de Importação TXT
        </h3>
        <p className="text-sm text-blue-700">
          Preencha os dados seguindo o modelo: STATUS MATRICULA NOME CARGO FIN. ORGAO LANC. TOTAL PAGO VALOR ORGAO_PGTO CPF
        </p>
      </div>

      {/* Dados do Funcionário */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Dados do Funcionário</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula * (7 dígitos)</Label>
            <Input
              id="matricula"
              value={formatMatricula(matricula)}
              onChange={(e) => handleMatriculaChange(e.target.value)}
              placeholder="001347-1"
              maxLength={8}
              disabled={isLoading}
            />
            {errors.matricula && <p className="text-sm text-red-600">{errors.matricula}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              value={formatCPF(cpf)}
              onChange={(e) => handleCpfChange(e.target.value)}
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={isLoading}
            />
            {errors.cpf && <p className="text-sm text-red-600">{errors.cpf}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nome">Nome Completo *</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="AUREA NUNES BARBOSA DA SILVA"
            disabled={isLoading}
          />
          {errors.nome && <p className="text-sm text-red-600">{errors.nome}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargo">Cargo *</Label>
          <Input
            id="cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="1-AGENTE OPERACIONAL DE SERVIC"
            disabled={isLoading}
          />
          {errors.cargo && <p className="text-sm text-red-600">{errors.cargo}</p>}
        </div>
      </div>

      {/* Dados do Financiamento */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Dados do Financiamento</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="finCode">Código FIN *</Label>
            <Input
              id="finCode"
              value={finCode}
              onChange={(e) => setFinCode(e.target.value)}
              placeholder="7400"
              disabled={isLoading}
            />
            {errors.finCode && <p className="text-sm text-red-600">{errors.finCode}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgao">Órgão *</Label>
            <Input
              id="orgao"
              value={orgao}
              onChange={(e) => setOrgao(e.target.value)}
              placeholder="001"
              disabled={isLoading}
            />
            {errors.orgao && <p className="text-sm text-red-600">{errors.orgao}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgaoPgto">Órgão Pgto</Label>
            <Input
              id="orgaoPgto"
              value={orgaoPgto}
              onChange={(e) => setOrgaoPgto(e.target.value)}
              placeholder="000"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalParcelas">Total de Parcelas *</Label>
            <Input
              id="totalParcelas"
              type="number"
              value={totalParcelas}
              onChange={(e) => setTotalParcelas(parseInt(e.target.value) || 0)}
              min={1}
              disabled={isLoading}
            />
            {errors.totalParcelas && <p className="text-sm text-red-600">{errors.totalParcelas}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="parcelasPagas">Parcelas Pagas *</Label>
            <Input
              id="parcelasPagas"
              type="number"
              value={parcelasPagas}
              onChange={(e) => setParcelasPagas(parseInt(e.target.value) || 0)}
              min={0}
              disabled={isLoading}
            />
            {errors.parcelasPagas && <p className="text-sm text-red-600">{errors.parcelasPagas}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorParcela">Valor da Parcela *</Label>
            <Input
              id="valorParcela"
              value={valorParcela ? formatCurrency(valorParcela) : ""}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 17,94"
              disabled={isLoading}
            />
            {errors.valorParcela && <p className="text-sm text-red-600">{errors.valorParcela}</p>}
          </div>
        </div>
      </div>

      {/* Dados da Entidade */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Dados da Entidade</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="entidadeCodigo">Código da Entidade *</Label>
            <Input
              id="entidadeCodigo"
              value={entidadeCodigo}
              onChange={(e) => setEntidadeCodigo(e.target.value)}
              placeholder="1048"
              disabled={isLoading}
            />
            {errors.entidadeCodigo && <p className="text-sm text-red-600">{errors.entidadeCodigo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entidadeNome">Nome da Entidade *</Label>
            <Input
              id="entidadeNome"
              value={entidadeNome}
              onChange={(e) => setEntidadeNome(e.target.value)}
              placeholder="EQUATORIAL PREVIDENCIA COMPLEMENTAR"
              disabled={isLoading}
            />
            {errors.entidadeNome && <p className="text-sm text-red-600">{errors.entidadeNome}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="refMonth">Mês de Referência *</Label>
            <select
              id="refMonth"
              value={refMonth}
              onChange={(e) => setRefMonth(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isLoading}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month.toString().padStart(2, "0")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refYear">Ano de Referência *</Label>
            <Input
              id="refYear"
              type="number"
              value={refYear}
              onChange={(e) => setRefYear(parseInt(e.target.value))}
              min={2020}
              max={2099}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Anexo de Contracheque */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Anexo de Contracheque</h4>
        
        <div className="space-y-2">
          <Label htmlFor="attachment">Contracheque (PDF, JPG, PNG)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="attachment"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isLoading}
              className="flex-1"
            />
            {attachmentFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <FileText className="h-4 w-4" />
                {attachmentFile.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? "Cadastrando..." : "Cadastrar Cliente"}
        </Button>
      </div>
    </form>
  );
}
