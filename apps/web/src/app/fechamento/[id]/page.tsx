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

function FechamentoDetailsContent({ caseId }: { caseId: number }) {
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

  // Mock data para anexos e notas (em produção viria da API)
  const mockAttachments = [
    {
      id: "1",
      filename: "documento_identidade.pdf",
      size: 2048000,
      uploadedAt: "2024-01-15T10:30:00Z",
      type: "application/pdf"
    },
    {
      id: "2",
      filename: "comprovante_renda.pdf",
      size: 1536000,
      uploadedAt: "2024-01-15T11:00:00Z",
      type: "application/pdf"
    }
  ];

  const mockNotes = [
    {
      id: "1",
      content: "Cliente confirmou dados pessoais por telefone.",
      author: "João Silva",
      createdAt: "2024-01-15T09:30:00Z",
      module: "Atendimento"
    },
    {
      id: "2",
      content: "Documentação verificada e aprovada.",
      author: "Maria Santos",
      createdAt: "2024-01-15T14:20:00Z",
      module: "Análise"
    }
  ];

  const handleApprove = (id: number) => {
    // Implementar aprovação
    console.log("Aprovar caso:", id);
  };

  const handleReject = (id: number) => {
    // Implementar rejeição
    console.log("Rejeitar caso:", id);
  };

  const handleAddNote = (note: string) => {
    // Implementar adição de nota
    console.log("Adicionar nota:", note);
  };

  const handleDownloadAttachment = (attachmentId: string) => {
    // Implementar download
    console.log("Download anexo:", attachmentId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando detalhes do caso...</span>
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
            Não foi possível carregar os detalhes do caso.
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
          <h1 className="text-2xl font-bold">Detalhes do Caso</h1>
          <p className="text-muted-foreground">Módulo de Fechamento</p>
        </div>
      </div>

      {/* Case Details */}
      <CaseDetails
        case={caseData}
        attachments={mockAttachments}
        notes={mockNotes}
        onApprove={handleApprove}
        onReject={handleReject}
        onAddNote={handleAddNote}
        onDownloadAttachment={handleDownloadAttachment}
        showActions={true}
      />
    </div>
  );
}

export default async function FechamentoDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const caseId = parseInt(resolvedParams.id);

  return <FechamentoDetailsContent caseId={caseId} />;
}