import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { WebSocketMessage } from '../types';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || (import.meta.env.DEV
  ? 'ws://localhost:3000'
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

export const useWebSocket = (enabled: boolean) => {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stoppedRef = useRef(false);

  const connect = useCallback(() => {
    if (stoppedRef.current) return;
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
              queryClient.invalidateQueries({ queryKey: ['queue-depth'] });
              break;
            case 'job-status-changed':
              queryClient.invalidateQueries({ queryKey: ['jobs'] });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              queryClient.invalidateQueries({ queryKey: ['queue-depth'] });
              break;
            case 'worker-heartbeat':
              queryClient.invalidateQueries({ queryKey: ['workers'] });
              break;
            case 'job-failed':
              if (msg.payload) {
                const { jobId, error, type } = msg.payload;
                toast.error(`Job ${jobId} (${type}) failed permanently:\n${error}`, {
                  duration: 6000,
                });
              }
              break;
          }
        } catch {
          console.warn('[WS] Failed to parse message');
        }
      };

      ws.onclose = () => {
        if (stoppedRef.current) return;
        console.log('[WS] Disconnected, reconnecting in 5s...');
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => console.error('[WS] Error', err);
    } catch (err) {
      console.error('[WS] Connection failed', err);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;
    connect();
    return () => {
      stoppedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect, enabled]);
};
