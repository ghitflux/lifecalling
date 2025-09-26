"use client";
import { useLiveCaseEvents } from "@/lib/ws";
import { useFinanceQueue, useFinanceDisburse } from "@/lib/hooks";
import { FinanceCard, FinanceMetrics } from "@lifecalling/ui";
import { useState } from "react";

export default function Page(){
  useLiveCaseEvents();
  const { data: items = [] } = useFinanceQueue();
  const disb = useFinanceDisburse();

  // Mock data para métricas - em produção viria da API
  const mockMetrics = {
    totalVolume: 2450000,
    monthlyTarget: 3000000,
    approvalRate: 87.5,
    pendingCount: items.length,
    overdueCount: 3,
    averageTicket: 85000
  };

  const handleDisburse = async (id: number, amount: number, installments: number) => {
    try {
      await disb.mutateAsync({
        case_id: id,
        total_amount: amount,
        installments: installments
      });
    } catch (error) {
      console.error('Erro ao efetivar:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestão Financeira</h1>
        <p className="text-muted-foreground">
          {items.length} casos pendentes de liberação
        </p>
      </div>

      {/* Métricas Financeiras */}
      <FinanceMetrics {...mockMetrics} />

      {/* Lista de Casos Financeiros */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Casos para Liberação</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {items.map((item: any) => (
            <FinanceCard
              key={item.id}
              id={item.id}
              clientName={item.client?.name || `Cliente ${item.id}`}
              totalAmount={item.total_amount || 50000}
              installments={item.installments || 12}
              status="approved"
              dueDate={new Date(Date.now() + 30*24*60*60*1000).toISOString()}
              onDisburse={handleDisburse}
            />
          ))}
          {items.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <p className="text-lg">✨ Nenhum caso pendente de liberação</p>
              <p className="text-sm">Todos os casos financeiros foram processados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
