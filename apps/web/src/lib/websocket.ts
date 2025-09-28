import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WebSocketMessage {
  type: 'case.updated' | 'simulation.updated' | 'case.assigned' | 'case.created' | 'pong' | 'ping' | 'hello' | 'error';
  data: any;
}

export function useWebSocket(token?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  let reconnectAttempts = 0;

  useEffect(() => {
    // WebSocket URL - conecta direto no backend
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

    const connectWebSocket = () => {
      try {
        // Adiciona token de autenticação se disponível
        const fullUrl = token ? `${wsUrl}?token=${token}` : wsUrl;
        wsRef.current = new WebSocket(fullUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
          reconnectAttempts = 0; // Reset contador de tentativas

          // Inicia heartbeat para manter conexão viva
          heartbeatIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000); // ping a cada 30 segundos
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);

            // Handle ping/pong for heartbeat
            if (message.type === 'pong') {
              return; // Apenas resposta do heartbeat
            }

            // Handle different message types
            switch (message.type) {
              case 'case.updated':
              case 'case.assigned':
              case 'case.created':
                // Invalidate case-related queries
                queryClient.invalidateQueries({ queryKey: ['cases'] });
                if (message.data?.id) {
                  queryClient.invalidateQueries({ queryKey: ['case', message.data.id] });
                }
                break;

              case 'simulation.updated':
                // Invalidate simulation-related queries
                queryClient.invalidateQueries({ queryKey: ['sims'] });
                if (message.data?.case_id) {
                  queryClient.invalidateQueries({ queryKey: ['case', message.data.case_id] });
                }
                break;

              default:
                console.log('🤷‍♂️ Unknown WebSocket message type:', message.type);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);

          // Limpa heartbeat interval
          if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
          }

          // Implementa exponential backoff para reconexão
          if (event.code !== 1000) { // Não foi fechamento normal
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`🔄 Tentativa de reconexão em ${delay}ms...`);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (reconnectAttempts < 5) { // Máximo de 5 tentativas
                reconnectAttempts++;
                connectWebSocket();
              } else {
                console.error('❌ Máximo de tentativas de reconexão atingido');
              }
            }, delay);
          }
        };

      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
        // Retry connection after 5 seconds
        setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }

      // Limpa todos os timers
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [queryClient, token]);

  // Return WebSocket connection status
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return {
    isConnected,
    ws: wsRef.current,
  };
}