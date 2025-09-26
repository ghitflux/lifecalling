"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useContracts } from "@/lib/hooks";
import { ContractCard, ContractSummary } from "@lifecalling/ui";

export default function Page(){
  useLiveCaseEvents();
  const { data: items = [] } = useContracts();

  // Mock data para estatísticas - em produção viria da API
  const mockStats = {
    total: items.length,
    active: items.filter((ct: any) => ct.status === 'active' || ct.status === 'ativo').length,
    completed: items.filter((ct: any) => ct.status === 'completed' || ct.status === 'encerrado').length,
    overdue: items.filter((ct: any) => ct.status === 'overdue' || ct.status === 'inadimplente').length,
    totalValue: items.reduce((sum: number, ct: any) => sum + (ct.total_amount || 0), 0),
    receivedValue: items.reduce((sum: number, ct: any) => {
      const installmentAmount = (ct.total_amount || 0) / (ct.installments || 1);
      return sum + (installmentAmount * (ct.paid_installments || 0));
    }, 0),
    overdueValue: 45000, // Mock value
    averageTicket: items.length > 0 ? items.reduce((sum: number, ct: any) => sum + (ct.total_amount || 0), 0) / items.length : 0
  };

  const handleViewDetails = (id: number) => {
    console.log('Ver detalhes do contrato:', id);
    // Implementar navegação para detalhes
  };

  const handleDownloadContract = (id: number) => {
    console.log('Download contrato:', id);
    // Implementar download do contrato
  };

  const handleEditContract = (id: number) => {
    console.log('Editar contrato:', id);
    // Implementar edição do contrato
  };

  const mapContractStatus = (status: string) => {
    const statusMap: { [key: string]: "active" | "completed" | "overdue" | "cancelled" } = {
      'ativo': 'active',
      'active': 'active',
      'encerrado': 'completed',
      'completed': 'completed',
      'inadimplente': 'overdue',
      'overdue': 'overdue',
      'cancelado': 'cancelled',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'active';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão de Contratos</h1>
        <p className="text-muted-foreground">
          {items.length} contratos ativos
        </p>
      </div>

      {/* Resumo de Contratos */}
      <ContractSummary
        stats={mockStats}
        monthlyTarget={15}
      />

      {/* Lista de Contratos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contratos Ativos</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {items.map((contract: any) => {
            const installmentAmount = (contract.total_amount || 0) / (contract.installments || 1);
            const nextDueDate = new Date();
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);

            return (
              <ContractCard
                key={contract.id}
                id={contract.id}
                clientName={contract.client?.name || `Cliente ${contract.case_id}`}
                totalAmount={contract.total_amount || 0}
                installmentAmount={installmentAmount}
                totalInstallments={contract.installments || 0}
                paidInstallments={contract.paid_installments || 0}
                status={mapContractStatus(contract.status)}
                startDate={contract.disbursed_at || contract.created_at}
                nextDueDate={nextDueDate.toISOString()}
                onViewDetails={handleViewDetails}
                onDownloadContract={handleDownloadContract}
                onEditContract={handleEditContract}
              />
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-lg">📄 Nenhum contrato efetivado</p>
              <p className="text-sm">Os contratos aparecerão aqui após a liberação financeira.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
