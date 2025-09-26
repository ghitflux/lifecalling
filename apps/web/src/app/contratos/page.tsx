"use client";
import { useCaseEventsReload } from "@/lib/ws";
import { useContracts } from "@/lib/hooks";
import { Card } from "@/components/ui/card";

export default function Page(){
  useCaseEventsReload();  
  const { data: items=[] } = useContracts();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Contratos</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((ct:any)=>(
          <Card key={ct.id} className="p-4 space-y-2">
            <div className="font-semibold">Contrato #{ct.id}</div>
            <div className="text-sm opacity-80">CASE #{ct.case_id}</div>
            <div className="text-sm">Valor total: R$ {ct.total_amount?.toFixed?.(2) ?? ct.total_amount}</div>
            <div className="text-sm">Parcelas: {ct.installments} | Pagas: {ct.paid_installments}</div>
            <div className="text-xs opacity-70">Status: {ct.status}</div>
          </Card>
        ))}
        {items.length===0 && <div className="opacity-70">Nenhum contrato efetivado.</div>}
      </div>
    </div>
  );
}
