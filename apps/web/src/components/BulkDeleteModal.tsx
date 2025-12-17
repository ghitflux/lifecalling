"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface BulkDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  selectedCount: number;
  entityName: string;
  isLoading?: boolean;
}

export function BulkDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  selectedCount,
  entityName,
  isLoading = false,
}: BulkDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription className="pt-3">
            Você está prestes a excluir{" "}
            <strong className="text-foreground">{selectedCount}</strong>{" "}
            {entityName}
            {selectedCount > 1 ? "s" : ""}.
            <br />
            <br />
            Esta ação <strong className="text-destructive">não pode ser desfeita</strong>.
            Todos os dados relacionados também serão removidos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
