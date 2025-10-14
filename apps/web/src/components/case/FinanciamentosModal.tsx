"use client";

/**
 * Modal para exibir financiamentos do cliente com scroll.
 * Usa o componente Financiamentos existente em um modal scrollável.
 */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Financiamentos from '@/components/clients/Financiamentos';

interface FinanciamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  clientName?: string;
}

export default function FinanciamentosModal({
  isOpen,
  onClose,
  clientId,
  clientName
}: FinanciamentosModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Financiamentos {clientName && `- ${clientName}`}
          </DialogTitle>
        </DialogHeader>

        {/* Container scrollável para o componente de financiamentos */}
        <div className="flex-1 overflow-y-auto pr-2">
          <Financiamentos clientId={clientId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
