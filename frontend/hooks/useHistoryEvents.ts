'use client';

import { useCallback, useMemo } from 'react';
import type { AuctionHistoryItem } from '@/types/auction';
import { useReconnectingEventSource } from './useReconnectingEventSource';
import { useSSEConnectionStore } from '@/store/useSSEConnectionStore';

/** LiveActivityFeed용 입찰 이벤트 */
export interface RecentBidPayload {
  user: string;
  modelName: string;
  amount: number;
  time: string;
}

interface UseHistoryEventsOptions {
  isActive: boolean;
  onNewDeal: (item: AuctionHistoryItem) => void;
  onNewBid?: (item: RecentBidPayload) => void;
  /** LiveStats 갱신 시그널 (statsUpdate 수신 시 호출) */
  onStatsUpdate?: () => void;
}

/** 거래내역 페이지 - SSE 새 체결 구독 (재연결·백오프 포함) */
export function useHistoryEvents({
  isActive,
  onNewDeal,
  onNewBid,
  onStatsUpdate,
}: UseHistoryEventsOptions) {
  const onMessage = useCallback(
    (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed?.type === 'statsUpdate') {
          onStatsUpdate?.();
          return;
        }
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
        } else if (parsed?.type === 'newBid' && parsed?.payload && onNewBid) {
          const p = parsed.payload;
          onNewBid({
            user: p.user ?? '-',
            modelName: p.modelName ?? '-',
            amount: p.amount ?? 0,
            time: p.time ?? '방금 전',
          });
        }
      } catch {
        // ping 등 기타 이벤트 무시
      }
    },
    [onNewDeal, onNewBid, onStatsUpdate],
  );

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

