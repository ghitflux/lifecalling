"use client";
import { useEffect } from "react";

/** Conecta no WS da API e dá reload quando um case/simulation muda. */
export function useCaseEventsReload() {
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    // http->ws e https->wss automaticamente
    const ws = new WebSocket(base.replace("http", "ws") + "/ws");

    ws.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data);
        if (ev?.event === "case.updated" || ev?.event === "simulation.updated") {
          location.reload(); // D3 simples; no D4 trocamos por invalidateQueries
        }
      } catch {}
    };

    return () => ws.close();
  }, []);
}
