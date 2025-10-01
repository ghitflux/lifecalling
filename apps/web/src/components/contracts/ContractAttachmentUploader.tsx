"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";

interface ContractAttachment {
  id: number;
  filename: string;
  size: number;
  uploaded_at: string;
  type: string;
}

interface ContractAttachmentUploaderProps {
  contractId: number;
  attachments: ContractAttachment[];
  onUpload: (file: File) => Promise<void>;
  onDelete?: (attachmentId: number) => Promise<void>;
  isUploading?: boolean;
}

export default function ContractAttachmentUploader({
  contractId,
  attachments,
  onUpload,
  onDelete,
  isUploading = false
}: ContractAttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não permitido. Use PDF, JPG, PNG ou DOC.");
      return;
    }

    setBusy(true);
    try {
      await onUpload(file);
      toast.success("Comprovante anexado com sucesso!");
    } catch (error) {
      toast.error("Erro ao anexar comprovante. Tente novamente.");
      console.error("Upload error:", error);
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!onDelete) return;

    setBusy(true);
    try {
      await onDelete(attachmentId);
      toast.success("Anexo removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover anexo. Tente novamente.");
      console.error("Delete error:", error);
    } finally {
      setBusy(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy || isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {busy || isUploading ? "Enviando..." : "Anexar Comprovante"}
        </Button>
        <span className="text-xs text-muted-foreground">
          PDF, JPG, PNG ou DOC até 10MB
        </span>
      </div>

      {/* Lista de Anexos */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Comprovantes Anexados ({attachments.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {attachment.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)} • {formatDate(attachment.uploaded_at)}
                    </p>
                  </div>
                </div>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={busy}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {attachments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum comprovante anexado</p>
          <p className="text-xs">
            Anexe comprovantes de pagamento para este contrato
          </p>
        </div>
      )}
    </div>
  );
}