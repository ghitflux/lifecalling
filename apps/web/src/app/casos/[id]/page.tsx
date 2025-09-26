"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/api";
import { toast } from "sonner";
import { useSendToCalculista } from "@/lib/hooks";

interface CaseDetail {
  id: number;
  status: string;
  client: {
    id: number;
    name: string;
    cpf: string;
    matricula: string;
    orgao: string;
    telefone_preferencial?: string;
    observacoes?: string;
  };
}

export default function CaseDetailPage() {
  const params = useParams();
  const caseId = parseInt(params.id as string);
  const queryClient = useQueryClient();
  
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hook para enviar para calculista
  const sendCalc = useSendToCalculista();

  // Query para buscar detalhes do caso
  const { data: caseDetail, isLoading } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      const response = await API.get(`/cases/${caseId}`);
      return response.data as CaseDetail;
    },
    enabled: !!caseId,
  });

  // Atualiza os campos quando os dados chegam
  useState(() => {
    if (caseDetail) {
      setTelefone(caseDetail.client.telefone_preferencial || "");
      setObservacoes(caseDetail.client.observacoes || "");
    }
  });

  // Mutation para atualizar caso
  const updateCaseMutation = useMutation({
    mutationFn: async (data: { telefone_preferencial?: string; observacoes?: string }) => {
      const response = await API.patch(`/cases/${caseId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      toast.success("Caso atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar caso");
    },
  });

  // Mutation para upload de anexo
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await API.post(`/cases/${caseId}/attachments`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      setSelectedFile(null);
      toast.success("Anexo enviado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar anexo");
    },
  });

  const handleSave = () => {
    const updates: any = {};
    if (telefone !== (caseDetail?.client.telefone_preferencial || "")) {
      updates.telefone_preferencial = telefone;
    }
    if (observacoes !== (caseDetail?.client.observacoes || "")) {
      updates.observacoes = observacoes;
    }
    
    if (Object.keys(updates).length > 0) {
      updateCaseMutation.mutate(updates);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Carregando detalhes do caso...</div>
      </div>
    );
  }

  if (!caseDetail) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-red-500">Caso não encontrado</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Caso #{caseDetail.id}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={caseDetail.status as any} />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary">Sem Contato</Button>
          <Button onClick={() => sendCalc.mutate(caseId)} disabled={sendCalc.isPending}>
            {sendCalc.isPending ? "Enviando..." : "Enviar para Calculista"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Dados do Cliente */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Dados do Cliente</h2>
          
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={caseDetail.client.name} disabled />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CPF</Label>
                <Input value={caseDetail.client.cpf} disabled />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input value={caseDetail.client.matricula} disabled />
              </div>
            </div>
            
            <div>
              <Label>Órgão</Label>
              <Input value={caseDetail.client.orgao} disabled />
            </div>
            
            <div>
              <Label>Telefone Preferencial</Label>
              <Input 
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            
            <div>
              <Label>Observações</Label>
              <Textarea 
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre o caso..."
                rows={4}
              />
            </div>
          </div>
        </Card>

        {/* Upload de Anexos */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-medium">Anexos</h2>
          
          <div className="space-y-3">
            <div>
              <Label>Enviar Anexo</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Formatos aceitos: PDF, DOC, DOCX, JPG, PNG
              </div>
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? "Enviando..." : "Enviar Anexo"}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Anexos Existentes</h3>
            <div className="text-sm text-muted-foreground">
              Nenhum anexo encontrado
            </div>
          </div>
        </Card>
      </div>

      {/* Histórico do Caso */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Histórico do Caso</h2>
        <div className="text-sm text-muted-foreground">
          Histórico de eventos será implementado em breve...
        </div>
      </Card>
    </div>
  );
}