"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CaseDetails, Button } from "@lifecalling/ui";
import { ArrowLeft, Loader2 } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function FinanceiroDetailsContent({ caseId }: { caseId: number }) {
  const router = useRouter();

  // Query para obter detalhes do caso
  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    },
    retry: 2,
  });

  // Mock data específico para o módulo financeiro
  const mockFinancialAttachments = [
    {
      id: "1",
      filename: "contrato_assinado.pdf",
      size: 3072000,
      uploadedAt: "2024-01-16T10:30:00Z",
      type: "application/pdf"
    },
    {
      id: "2",
      filename: "comprovante_conta.pdf",
      size: 1024000,
      uploadedAt: "2024-01-16T11:00:00Z",
      type: "application/pdf"
    },
    {
      id: "3",
      filename: "autorizacao_desconto.pdf",
      size: 512000,
      uploadedAt: "2024-01-16T11:30:00Z",
      type: "application/pdf"
    }
  ];

  const mockFinancialNotes = [
    {
      id: "1",
      content: "Simulação aprovada pelo fechamento. Pronto para liberação.",
      author: "Sistema",
      createdAt: "2024-01-16T08:00:00Z",
      module: "Fechamento"
    },
    {
      id: "2",
      content: "Dados bancários validados. Conta corrente ativa.",
      author: "Carlos Financeiro",
      createdAt: "2024-01-16T09:15:00Z",
      module: "Financeiro"
    },
    {
      id: "3",
      content: "Aguardando documentação adicional para liberação.",
      author: "Ana Costa",
      createdAt: "2024-01-16T14:30:00Z",
      module: "Financeiro"
    }
  ];

  const handleDisburse = (id: number) => {
    // Implementar liberação financeira
    console.log("Efetivar liberação:", id);
  };

  const handleAddNote = (note: string) => {
    // Implementar adição de nota financeira
    console.log("Adicionar nota financeira:", note);
  };

  const handleDownloadAttachment = (attachmentId: string) => {
    // Implementar download de anexo
    console.log("Download anexo financeiro:", attachmentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando detalhes financeiros...</span>
        </div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Erro ao carregar caso</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os detalhes financeiros do caso.
          </p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Detalhes Financeiros</h1>
          <p className="text-muted-foreground">Módulo Financeiro</p>
        </div>
      </div>

      {/* Case Details */}
      <CaseDetails
        case={caseData}
        attachments={mockFinancialAttachments}
        notes={mockFinancialNotes}
        onApprove={handleDisburse}
        onAddNote={handleAddNote}
        onDownloadAttachment={handleDownloadAttachment}
        showActions={true}
      />
    </div>
  );
}

export default async function FinanceiroDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const caseId = parseInt(resolvedParams.id);

  return <FinanceiroDetailsContent caseId={caseId} />;
}