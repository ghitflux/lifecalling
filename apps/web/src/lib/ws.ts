"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** WebSocket → invalida queries; sem reload de página. */
export function useLiveCaseEvents() {
  const qc = useQueryClient();

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const url =
      (base.startsWith("https") ? base.replace("https", "wss") : base.replace("http", "ws")) + "/ws";

    const ws = new WebSocket(url);
    ws.onopen = () => console.debug("[WS] connected:", url);
    ws.onmessage = (m) => {
      try {
        const ev = JSON.parse(m.data);
        if (!ev?.event) return;

        if (ev.event === "case.updated") {
          qc.invalidateQueries({ queryKey: ["cases"] });
          qc.invalidateQueries({ queryKey: ["closing", "queue"] });
          qc.invalidateQueries({ queryKey: ["finance", "queue"] });
          qc.invalidateQueries({ queryKey: ["contracts"] });
        } else if (ev.event === "simulation.updated") {
          qc.invalidateQueries({ queryKey: ["simulations"] });
          qc.invalidateQueries({ queryKey: ["cases"] });
        }
      } catch (e) {
        console.warn("[WS] parse error", e);
      }
    };
    ws.onerror = (e) => console.warn("[WS] error", e);

    return () => ws.close();
  }, [qc]);
}
