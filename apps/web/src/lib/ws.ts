"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const makeWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
  const path = process.env.NEXT_PUBLIC_WS_PATH || "/ws/events";

  // Se base for relativo (/api), derive do location
  const isRelative = base.startsWith("/");
  const origin = isRelative ? window.location.origin : base;

  const url = new URL(path, origin);
  url.protocol = url.protocol.replace("http", "ws");
  return url.toString();
};

/**
 * WebSocket com backoff exponencial e máximo de tentativas.
 * Invalida queries do React Query sem reload de página.
 */
export function useLiveCaseEvents() {
  const qc = useQueryClient();

  useEffect(() => {
    const wsUrl = makeWsUrl();
    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_DELAY = 1000; // 1 segundo
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let shouldReconnect = true;

    const connect = () => {
      if (!shouldReconnect) return;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.debug("[WS] connected:", wsUrl);
          reconnectAttempts = 0; // Reset no sucesso
        };

        ws.onmessage = (m) => {
          try {
            const ev = JSON.parse(m.data);
            if (!ev?.event) return;

            console.debug("[WS] Received event:", ev.event, ev.payload);

            if (ev.event === "case.updated") {
              // Invalidação imediata e específica
              qc.invalidateQueries({ queryKey: ["cases"], refetchType: "active" });
              qc.invalidateQueries({ queryKey: ["closing", "queue"], refetchType: "active" });
              qc.invalidateQueries({ queryKey: ["finance", "queue"], refetchType: "active" });
              qc.invalidateQueries({ queryKey: ["contracts"], refetchType: "active" });

              // Invalidar caso específico se payload tiver case_id
              if (ev.payload?.case_id) {
                qc.invalidateQueries({ queryKey: ["case", ev.payload.case_id], refetchType: "active" });
              }
            } else if (ev.event === "simulation.updated") {
              // Invalidação imediata e específica
              qc.invalidateQueries({ queryKey: ["simulations"], refetchType: "active" });
              qc.invalidateQueries({ queryKey: ["cases"], refetchType: "active" });

              // Invalidar simulação específica se payload tiver simulation_id
              if (ev.payload?.simulation_id) {
                qc.invalidateQueries({ queryKey: ["simulation", ev.payload.simulation_id], refetchType: "active" });
              }
            }
          } catch (e) {
            console.warn("[WS] parse error", e);
          }
        };

        ws.onerror = (e) => {
          console.warn("[WS] error", e);
        };

        ws.onclose = (e) => {
          console.debug("[WS] closed, code:", e.code);

          // Se foi 401 (Unauthorized), não reconectar
          if (e.code === 1008 || e.code === 1006) {
            // 1008 = policy violation (pode ser auth)
            // 1006 = abnormal closure (pode incluir auth failures)
            console.warn("[WS] Possível erro de autenticação, não reconectando");
            shouldReconnect = false;
            return;
          }

          // Se excedeu máximo de tentativas, parar
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.warn(`[WS] Máximo de ${MAX_RECONNECT_ATTEMPTS} tentativas atingido`);
            shouldReconnect = false;
            return;
          }

          // Backoff exponencial: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(BASE_DELAY * Math.pow(2, reconnectAttempts), 16000);
          console.debug(`[WS] Tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS} em ${delay}ms`);

          reconnectAttempts++;
          reconnectTimeout = setTimeout(() => {
            if (shouldReconnect) {
              connect();
            }
          }, delay);
        };
      } catch (err) {
        console.error("[WS] Erro ao criar WebSocket:", err);
      }
    };

    connect();

    // Cleanup
    return () => {
      shouldReconnect = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [qc]);
}
