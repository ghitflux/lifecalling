/* packages/ui/src/CaseNotesEditor.tsx */
import React, { useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { cn } from "./lib/utils";
import { MessageSquare, Phone, Save, X } from "lucide-react";

export interface CaseNotesEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: number;
  initialPhone?: string;
  initialNotes?: string;
  onSave: (data: { telefone_preferencial?: string; observacoes?: string }) => void;
  isLoading?: boolean;
  className?: string;
}

export function CaseNotesEditor({
  open,
  onOpenChange,
  caseId,
  initialPhone = "",
  initialNotes = "",
  onSave,
  isLoading = false,
  className
}: CaseNotesEditorProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [notes, setNotes] = useState(initialNotes);

  React.useEffect(() => {
    if (open) {
      setPhone(initialPhone);
      setNotes(initialNotes);
    }
  }, [open, initialPhone, initialNotes]);

  const handleSave = () => {
    onSave({
      telefone_preferencial: phone.trim() || undefined,
      observacoes: notes.trim() || undefined
    });
  };

  const hasChanges = phone !== initialPhone || notes !== initialNotes;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className={cn(
        "relative bg-background rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col mx-4",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Editar Informações</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Caso #{caseId}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Phone className="h-4 w-4" />
              Telefone Preferencial
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Notes Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <MessageSquare className="h-4 w-4" />
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações importantes sobre este caso..."
              className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={4}
            />
            <div className="text-xs text-muted-foreground text-right">
              {notes.length}/500 caracteres
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {hasChanges ? "Há alterações não salvas" : "Nenhuma alteração"}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-1" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}