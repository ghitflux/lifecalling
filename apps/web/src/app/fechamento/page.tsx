"use client";
import { useCaseEventsReload } from "@/lib/ws";
import { useClosingQueue, useClosingApprove, useClosingReject } from "@/lib/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page(){
  useCaseEventsReload();
  const { data: items = [] } = useClosingQueue();
  const approve = useClosingApprove();
  const reject = useClosingReject();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Fechamento</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((it:any)=>(
          <Card key={it.id} className="p-4 space-y-3">
            <div className="font-semibold">CASE #{it.id}</div>
            <div className="text-sm opacity-80">Status: {it.status}</div>
            <div className="flex gap-2">
              <Link href={`/cases/${it.id}`} className="flex-1">
                <Button variant="outline" className="w-full">Ver Detalhes</Button>
              </Link>
              <Button onClick={()=>approve.mutate(it.id)}>Aprovar</Button>
              <Button variant="destructive" onClick={()=>reject.mutate(it.id)}>Reprovar</Button>
            </div>
          </Card>
        ))}
        {items.length===0 && <div className="opacity-70">Sem pendências.</div>}
      </div>
    </div>
  );
}
