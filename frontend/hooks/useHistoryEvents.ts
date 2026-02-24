'use client';

import { useEffect, useRef } from 'react';
import type { AuctionHistoryItem } from '@/types/auction';

interface UseHistoryEventsOptions {
  isActive: boolean;
  onNewDeal: (item: AuctionHistoryItem) => void;
}

/** 거래내역 페이지 - SSE 새 체결 구독 */
export function useHistoryEvents({
  isActive,
  onNewDeal,
}: UseHistoryEventsOptions) {
  const onNewDealRef = useRef(onNewDeal);

  useEffect(() => {
    onNewDealRef.current = onNewDeal;
  }, [onNewDeal]);

  useEffect(() => {
    if (!isActive) return;

    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/events/history`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
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
          onNewDealRef.current(item);
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
  }, [isActive]);
}

