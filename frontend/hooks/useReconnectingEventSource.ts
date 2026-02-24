'use client';

import { useEffect, useRef } from 'react';

const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export interface UseReconnectingEventSourceOptions {
  /** 연결 실패 시 재시도 (기본 true) */
  reconnect?: boolean;
  /** 최대 재연결 지연(ms). 기본 30000 */
  maxDelayMs?: number;
}

export type SSEConnectionStatus = 'connected' | 'reconnecting';

/**
 * SSE EventSource를 재연결·지수 백오프로 관리.
 * onerror 시 close 후 delay 후 재연결, delay는 1s → 2s → 4s … cap까지 증가.
 */
export function useReconnectingEventSource(
  url: string | null,
  options: {
    onMessage: (e: MessageEvent) => void;
    enabled: boolean;
    reconnect?: boolean;
    maxDelayMs?: number;
    onStatusChange?: (status: SSEConnectionStatus) => void;
  },
): void {
  const {
    onMessage,
    enabled,
    reconnect = true,
    maxDelayMs = MAX_DELAY_MS,
    onStatusChange,
  } = options;
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(INITIAL_DELAY_MS);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!url || !enabled) return;

    let es: EventSource | null = new EventSource(url);

    const scheduleReconnect = () => {
      if (!mountedRef.current || !reconnect) return;
      onStatusChange?.('reconnecting');
      es?.close();
      es = null;
      const delay = Math.min(delayRef.current, maxDelayMs);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (!mountedRef.current) return;
        delayRef.current = Math.min(delayRef.current * 2, maxDelayMs);
        es = new EventSource(url);
        es.onmessage = handleMessage;
        es.onerror = handleError;
        es.onopen = () => {
          delayRef.current = INITIAL_DELAY_MS;
          onStatusChange?.('connected');
        };
      }, delay);
    };

    const handleMessage = (e: MessageEvent) => {
      onMessageRef.current(e);
    };

    const handleError = () => {
      if (!mountedRef.current) return;
      scheduleReconnect();
    };

    es.onmessage = handleMessage;
    es.onerror = handleError;
    es.onopen = () => {
      delayRef.current = INITIAL_DELAY_MS;
      onStatusChange?.('connected');
    };

    return () => {
      onStatusChange?.('connected');
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      es?.close();
      es = null;
      delayRef.current = INITIAL_DELAY_MS;
    };
  }, [url, enabled, reconnect, maxDelayMs, onStatusChange]);
}
