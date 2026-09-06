import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WebSocketMessage } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => console.log('[WS] Connected');

      ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          switch (msg.event) {
            case 'stats-update':
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              break;
            case 'job-status-changed':
              queryClient.invalidateQueries({ queryKey: ['jobs'] });
              break;
            case 'worker-heartbeat':
              queryClient.invalidateQueries({ queryKey: ['workers'] });
              break;
          }
        } catch {
          console.warn('[WS] Failed to parse message');
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 5s...');
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => console.error('[WS] Error', err);
    } catch (err) {
      console.error('[WS] Connection failed', err);
    }
  }, [queryClient]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
};
