'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useReconnectingEventSource } from '@/hooks/useReconnectingEventSource';
import { queryKeys } from '@/hooks/query/queryKeys';

/**
 * 로그인 사용자 알림 SSE — 새 알림 시 목록·미읽음 쿼리 무효화
 */
export function useNotificationStream(enabled: boolean) {
  const queryClient = useQueryClient();

  const onMessage = useCallback(
    (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data) as { type?: string };
        if (parsed?.type === 'ping') return;
        if (parsed?.type === 'notification') {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.list(),
          });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.unreadCount(),
          });
        }
      } catch {
        // ignore
      }
    },
    [queryClient],
  );

  const url = useMemo(
    () =>
      typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
        ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/notifications/stream`
        : null,
    [],
  );

  useReconnectingEventSource(url, {
    onMessage,
    enabled: enabled && Boolean(url),
  });
}
