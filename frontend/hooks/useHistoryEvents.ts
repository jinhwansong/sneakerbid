'use client';

import { useCallback, useMemo } from 'react';
import type { AuctionHistoryItem } from '@/types/auction';
import { useReconnectingEventSource } from './useReconnectingEventSource';
import { useSSEConnectionStore } from '@/store/useSSEConnectionStore';

interface UseHistoryEventsOptions {
  isActive: boolean;
  onNewDeal: (item: AuctionHistoryItem) => void;
}

/** 거래내역 페이지 - SSE 새 체결 구독 (재연결·백오프 포함) */
export function useHistoryEvents({
  isActive,
  onNewDeal,
}: UseHistoryEventsOptions) {
  const onMessage = useCallback((e: MessageEvent) => {
    try {
      const parsed = JSON.parse(e.data);
      if (parsed?.type === 'newDeal' && parsed?.payload) {
        const item: AuctionHistoryItem = {
          auctionId: parsed.payload.auctionId,
          imageUrl: parsed.payload.imageUrl,
          brand: parsed.payload.brand,
          modelName: parsed.payload.modelName,
          participants: parsed.payload.participants ?? 0,
          finalPrice: parsed.payload.finalPrice,
          date: parsed.payload.date ?? '',
          status: parsed.payload.status ?? 'completed',
        };
        onNewDeal(item);
      }
    } catch {
      // ping 등 기타 이벤트 무시
    }
  }, [onNewDeal]);

  const url = useMemo(
    () =>
      typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/events/history`
        : null,
    [],
  );

  const addReconnecting = useSSEConnectionStore((s) => s.addReconnecting);
  const removeReconnecting = useSSEConnectionStore((s) => s.removeReconnecting);

  const onStatusChange = useCallback(
    (status: 'connected' | 'reconnecting') => {
      if (status === 'reconnecting') addReconnecting();
      else removeReconnecting();
    },
    [addReconnecting, removeReconnecting],
  );

  useReconnectingEventSource(url, {
    onMessage,
    enabled: isActive,
    onStatusChange,
  });
}

