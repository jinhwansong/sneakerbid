'use client';

import { useEffect, useRef } from 'react';
import type { BidLogItem } from '@/types/auction';

interface UseAuctionEventsOptions {
  auctionId: string;
  isActive: boolean;
  onNewBid: (bid: BidLogItem) => void;
}

/** 경매 상세 페이지 - SSE 실시간 입찰 구독 */
export function useAuctionEvents({
  auctionId,
  isActive,
  onNewBid,
}: UseAuctionEventsOptions) {
  const onNewBidRef = useRef(onNewBid);

  useEffect(() => {
    onNewBidRef.current = onNewBid;
  }, [onNewBid]);

  useEffect(() => {
    if (!auctionId || !isActive) return;

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/events/auction/${auctionId}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
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
          onNewBidRef.current(bid);
        }
      } catch {
        // ping 등 기타 이벤트 무시
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [auctionId, isActive]);
}
