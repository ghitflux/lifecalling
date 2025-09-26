"use client";
import { useCaseEventsReload } from "@/lib/ws";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@lifecalling/ui";
import { Label } from "@radix-ui/react-label";
import { simuladorSantander, priceCoef } from "@/lib/calc";
import { useSims, useSimApprove, useSimReject } from "@/lib/hooks";
import { toast } from "sonner";

export default function CalculistaPage(){
  useCaseEventsReload();
  const { data: sims } = useSims("pending");
  const [active, setActive] = useState<number | null>(null);
  const approve = useSimApprove();
  const reject = useSimReject();

  // estados de input (por simplicidade, um conjunto compartilhado; em prod, seria por simId)
  const [banco, setBanco] = useState("SANTANDER");
  const [parcelas, setParcelas] = useState(96);
  const [saldo, setSaldo] = useState(30000);
  const [parcela, setParcela] = useState(1000);
  const [seguro, setSeguro] = useState(1000);
  const [percOp, setPercOp] = useState(2.5);
  const [percConsult, setPercConsult] = useState(12);
  const [coefManual, setCoefManual] = useState<string>("");

  const coefAuto = priceCoef(percOp/100, parcelas);
  const r = simuladorSantander({
    banco, parcelas, saldoDevedor: saldo, parcela,
    seguroObrigatorio: seguro,
    percentualOperacaoMes: percOp,
    percentualConsultoria: percConsult/100,
    coeficienteManual: coefManual ? Number(coefManual) : null,
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Calculista — Pendências</h1>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-3 md:col-span-1">
          <div className="font-medium">Fila</div>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {sims?.map((s)=>(
              <button key={s.id} onClick={()=>setActive(s.id)}
                className={`w-full text-left p-3 rounded-xl ${active===s.id?"bg-primary/20":"bg-card"}`}>
                <div className="text-sm opacity-80">SIM #{s.id}</div>
                <div className="text-xs opacity-60">CASE #{s.case_id}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="font-medium">Entrada Manual</div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Banco</Label><Input value={banco} onChange={e=>setBanco(e.target.value)} /></div>
              <div><Label>Parcelas (n)</Label><Input type="number" value={parcelas} onChange={e=>setParcelas(Number(e.target.value)||0)} /></div>
              <div><Label>Saldo devedor (C7)</Label><Input type="number" value={saldo} onChange={e=>setSaldo(Number(e.target.value)||0)} /></div>
              <div><Label>Parcela (B7)</Label><Input type="number" value={parcela} onChange={e=>setParcela(Number(e.target.value)||0)} /></div>
              <div><Label>Seguro obrigatório (E23)</Label><Input type="number" value={seguro} onChange={e=>setSeguro(Number(e.target.value)||0)} /></div>
              <div><Label>% operação (i/mês)</Label><Input type="number" step="0.01" value={percOp} onChange={e=>setPercOp(Number(e.target.value)||0)} /></div>
              <div><Label>% consultoria (E31)</Label><Input type="number" step="0.01" value={percConsult} onChange={e=>setPercConsult(Number(e.target.value)||0)} /></div>
              <div>
                <Label>Coeficiente (D4 • opcional)</Label>
                <Input placeholder={coefAuto.toFixed(7)} value={coefManual} onChange={e=>setCoefManual(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Cancelar</Button>
              <Button disabled={!active} onClick={()=>{
                if(!active) return;
                approve.mutate({
                  simId: active,
                  payload: {
                    manual_input: { banco, parcelas, saldo, parcela, seguro, percOp, percConsult, coefManual },
                    results: r
                  }
                });
              }}>Aprovar</Button>
              <Button variant="destructive" disabled={!active} onClick={()=>{
                if(!active) return;
                reject.mutate({
                  simId: active,
                  payload: {
                    manual_input: { banco, parcelas, saldo, parcela, seguro, percOp, percConsult, coefManual },
                    results: r
                  }
                });
              }}>Reprovar</Button>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="font-medium">Resultados</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Coeficiente (D4)</div><div>{r.coeficiente.toFixed(7)}</div>
              <div>Valor liberado (E7)</div><div>R$ {r.valorLiberado.toFixed(2)}</div>
              <div>Valor parcela total (E17)</div><div>R$ {r.valorParcelaTotal.toFixed(2)}</div>
              <div>Saldo devedor total (E18)</div><div>R$ {r.saldoDevedorTotal.toFixed(2)}</div>
              <div>Valor liberado total (E20)</div><div>R$ {r.valorLiberadoTotal.toFixed(2)}</div>
              <div>Valor total financiado (E22)</div><div>R$ {r.valorTotalFinanciado.toFixed(2)}</div>
              <div>Valor líquido (E25)</div><div>R$ {r.valorLiquido.toFixed(2)}</div>
              <div>Custo consultoria (E27)</div><div>R$ {r.custoConsultoria.toFixed(2)}</div>
              <div>Liberado cliente (E29)</div><div>R$ {r.liberadoCliente.toFixed(2)}</div>
              <div>30% do líquido (E51)</div><div>R$ {r.trintaPorCentoDoLiquido.toFixed(2)}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
