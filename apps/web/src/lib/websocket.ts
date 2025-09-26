import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WebSocketMessage {
  type: 'case.updated' | 'simulation.updated' | 'case.assigned' | 'case.created';
  data: any;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // WebSocket URL - replace with your actual WebSocket endpoint
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', message);

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

          // Attempt to reconnect after 3 seconds if not a normal closure
          if (event.code !== 1000) {
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect WebSocket...');
              connectWebSocket();
            }, 3000);
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
    };
  }, [queryClient]);

  // Return WebSocket connection status
  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  return {
    isConnected,
    ws: wsRef.current,
  };
}