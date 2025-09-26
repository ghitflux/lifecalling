"use client";
import { useCaseEventsReload } from "@/lib/ws";
import { useFinanceQueue, useFinanceDisburse } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function FinanceCard({ c }:{ c:any }){
  useCaseEventsReload();
  const [amount, setAmount] = useState(0);
  const [inst, setInst] = useState(0);
  const disb = useFinanceDisburse();

  return (
    <Card className="p-4 space-y-3">
      <div className="font-semibold">CASE #{c.id}</div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs">Valor total</label><Input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value)||0)} /></div>
        <div><label className="text-xs">Parcelas</label><Input type="number" value={inst} onChange={e=>setInst(Number(e.target.value)||0)} /></div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={()=>disb.mutate({ case_id:c.id, total_amount: amount, installments: inst })}
          disabled={disb.isPending || amount<=0 || inst<=0}
        >Efetivar Pagamento</Button>
      </div>
    </Card>
  );
}

export default function Page(){
  const { data: items = [] } = useFinanceQueue();
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Financeiro</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it:any)=> <FinanceCard key={it.id} c={it} />)}
        {items.length===0 && <div className="opacity-70">Sem pendências.</div>}
      </div>
    </div>
  );
}
