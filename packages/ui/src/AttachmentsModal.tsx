import React, { useState } from "react";
import { Button } from "./Button";
import { formatFileSize } from "./lib/utils";
import { X, Download, Upload, FileText, Trash2, Plus } from "lucide-react";

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
  url?: string;
}

export interface AttachmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: string;
    type: 'receita' | 'despesa';
    name: string;
    amount: number;
    date: string;
  } | null;
  attachments: Attachment[];
  onDownloadAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onUploadAttachment: (files: File[]) => void;
  loading?: boolean;
}

export function AttachmentsModal({
  isOpen,
  onClose,
  transaction,
  attachments,
  onDownloadAttachment,
  onDeleteAttachment,
  onUploadAttachment,
  loading = false
}: AttachmentsModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  if (!isOpen || !transaction) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUploadAttachment(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const getFileIcon = (filename: string, mimeType: string) => {
    if (mimeType?.includes('image')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType?.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Anexos da Transação</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.type === 'receita' ? 'Receita' : 'Despesa'}: {transaction.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Valor: R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Lista de anexos existentes */}
          <div className="space-y-4">
            <h3 className="text-md font-medium">Anexos Existentes ({attachments.length})</h3>
            
            {attachments.length > 0 ? (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg bg-card border-border">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(attachment.filename, attachment.mime_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDownloadAttachment(attachment.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Deseja realmente remover este anexo?")) {
                            onDeleteAttachment(attachment.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum anexo encontrado</p>
              </div>
            )}
          </div>

          {/* Seção para adicionar novos anexos */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-md font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novos Anexos
            </h3>
            
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                multiple
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              
              {/* Lista de arquivos selecionados */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Arquivos selecionados:</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded bg-background">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            {selectedFiles.length > 0 && (
              <Button
                onClick={handleUpload}
                disabled={loading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Enviando..." : `Enviar ${selectedFiles.length} arquivo(s)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}