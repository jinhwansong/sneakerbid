'use client';

import { useCallback, useMemo } from 'react';
import type { BidLogItem } from '@/types/auction';
import type { AuctionClosedPayload } from '@/types/events';
import { useReconnectingEventSource } from './useReconnectingEventSource';
import { useSSEConnectionStore } from '@/store/useSSEConnectionStore';

interface UseAuctionEventsOptions {
  auctionId: string;
  isActive: boolean;
  onNewBid: (bid: BidLogItem) => void;
  onAuctionClosed?: (payload: AuctionClosedPayload) => void;
}

/** 경매 상세 페이지 - SSE 실시간 입찰 구독 (재연결·백오프 포함) */
export function useAuctionEvents({
  auctionId,
  isActive,
  onNewBid,
  onAuctionClosed,
}: UseAuctionEventsOptions) {
  const onMessage = useCallback(
    (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed?.type === 'newBid' && parsed?.payload) {
          const bid: BidLogItem = {
            id: parsed.payload.id,
            user: parsed.payload.user,
            amount: parsed.payload.amount,
            time: parsed.payload.time ?? '방금 전',
            isBot: parsed.payload.isBot,
          };
          onNewBid(bid);
        } else if (parsed?.type === 'auctionClosed' && parsed?.payload && onAuctionClosed) {
          const p = parsed.payload;
          const finalPrice = p.finalPrice;
          if (typeof finalPrice !== 'number' || !Number.isFinite(finalPrice)) {
            return; // skip malformed event
          }
          const payload: AuctionClosedPayload = {
            status: p.status === 'buy_now' ? 'buy_now' : 'CLOSED',
            winnerUserId: p.winnerUserId ?? null,
            finalPrice,
          };
          onAuctionClosed(payload);
        }
      } catch {
        // ping 등 기타 이벤트 무시
      }
    },
    [onNewBid, onAuctionClosed],
  );

  const url = useMemo(
    () =>
      auctionId && typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/events/auction/${auctionId}`
        : null,
    [auctionId],
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
    enabled: !!auctionId && isActive,
    onStatusChange,
  });
}
