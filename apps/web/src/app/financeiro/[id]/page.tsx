"use client";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CaseDetails, Button } from "@lifecalling/ui";
import { ArrowLeft, Loader2, RefreshCw, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

function FinanceiroDetailsContent({ caseId }: { caseId: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query para obter detalhes do caso
  const { data: caseData, isLoading, error } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    },
    retry: 2,
  });

  // Buscar anexos reais do caso
  const { data: attachmentsData } = useQuery({
    queryKey: ["caseAttachments", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}/attachments`);
      return response.data;
    },
    retry: 2,
  });

  // Buscar eventos/notas reais do caso
  const { data: eventsData } = useQuery({
    queryKey: ["caseEvents", caseId],
    queryFn: async () => {
      const response = await api.get(`/cases/${caseId}/events`);
      return response.data;
    },
    retry: 2,
  });

  // Converter anexos para o formato esperado pelo CaseDetails
  const attachments = (attachmentsData?.items || []).map((attachment: any) => ({
    id: attachment.id.toString(),
    filename: attachment.filename,
    size: attachment.size,
    uploadedAt: attachment.uploaded_at || attachment.created_at,
    type: attachment.mime || "application/octet-stream"
  }));

  // Converter eventos para o formato de notas esperado pelo CaseDetails
  const notes = (eventsData?.items || []).map((event: any) => ({
    id: event.id.toString(),
    content: event.payload?.message || event.payload?.comment || `Evento: ${event.type}`,
    author: event.created_by || "Sistema",
    createdAt: event.created_at,
    module: event.type?.includes("finance") ? "Financeiro" : 
            event.type?.includes("calculista") ? "Calculista" :
            event.type?.includes("fechamento") ? "Fechamento" : "Sistema"
  }));

  // Mutation para devolver caso ao calculista
  const returnToCalculistaMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/cases/${caseId}/return-to-calculista`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Caso devolvido ao calculista para recálculo");
      router.push("/financeiro");
    },
    onError: (error: any) => {
      console.error("Erro ao devolver caso:", error);
      toast.error("Erro ao devolver caso ao calculista");
    }
  });

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

  const handleReturnToCalculista = () => {
    if (confirm("Tem certeza que deseja devolver este caso ao calculista para recálculo?")) {
      returnToCalculistaMutation.mutate();
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToCalculista}
            disabled={returnToCalculistaMutation.isPending}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
            title="Devolver para o calculista recalcular"
          >
            {returnToCalculistaMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Devolvendo...
              </>
            ) : (
              <>
                <Undo2 className="h-4 w-4 mr-2" />
                Devolver para Recálculo
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Forçar refresh de todas as queries relacionadas ao caso
              queryClient.invalidateQueries({ queryKey: ["case", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseAttachments", caseId] });
              queryClient.invalidateQueries({ queryKey: ["caseEvents", caseId] });
              // Forçar refetch imediato
              queryClient.refetchQueries({ queryKey: ["case", caseId] });
              toast.success("Dados atualizados!");
            }}
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Case Details */}
      <CaseDetails
        case={caseData}
        attachments={attachments}
        notes={notes}
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