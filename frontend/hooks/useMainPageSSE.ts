'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSEConnectionStore } from '@/store/useSSEConnectionStore';
import { updateMainCacheAuctionBid } from '@/lib/mainCacheUpdater';

const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const MAX_SUBSCRIPTIONS = 12; // 동시 구독 경매 수 제한

/** 메인페이지 경매 목록에 SSE 연결 (여러 경매 동시 구독) */
export function useMainPageSSE(auctionIds: string[]) {
  const queryClient = useQueryClient();
  const addReconnecting = useSSEConnectionStore((s) => s.addReconnecting);
  const removeReconnecting = useSSEConnectionStore((s) => s.removeReconnecting);
  const mountedRef = useRef(true);
  const delaysRef = useRef<Map<string, number>>(new Map());
  const connectionsRef = useRef<Map<string, EventSource>>(new Map());
  const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const idsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectionsRef.current.forEach((es) => {
        es.close();
      });
      connectionsRef.current.clear();
      timeoutsRef.current.forEach((t) => {
        clearTimeout(t);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const ids = auctionIds.slice(0, MAX_SUBSCRIPTIONS);
    const baseUrl =
      typeof process.env.NEXT_PUBLIC_SITE_URL === 'string'
        ? process.env.NEXT_PUBLIC_SITE_URL
        : '';

    if (!baseUrl || ids.length === 0) return;

    idsRef.current = new Set(ids);

    const connect = (auctionId: string) => {
      const url = `${baseUrl}/events/auction/${auctionId}`;
      const es = new EventSource(url);

      es.onmessage = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.type === 'newBid' && parsed?.payload) {
            const amount = parsed.payload.amount as number;
            updateMainCacheAuctionBid(queryClient, auctionId, amount, 1);
          }
        } catch {
          // ping 등 무시
        }
      };

      es.onerror = () => {
        if (!mountedRef.current) return;
        es.close();
        connectionsRef.current.delete(auctionId);
        addReconnecting();
        const currentDelay = delaysRef.current.get(auctionId) ?? INITIAL_DELAY_MS;
        const delay = Math.min(currentDelay, MAX_DELAY_MS);
        const t = setTimeout(() => {
          timeoutsRef.current.delete(t);
          if (!mountedRef.current) return;
          if (idsRef.current.has(auctionId)) {
            const nextDelay = Math.min(currentDelay * 2, MAX_DELAY_MS);
            delaysRef.current.set(auctionId, nextDelay);
            connect(auctionId);
          }
          removeReconnecting();
        }, delay);
        timeoutsRef.current.add(t);
      };

      es.onopen = () => {
        delaysRef.current.set(auctionId, INITIAL_DELAY_MS);
        removeReconnecting();
      };

      connectionsRef.current.set(auctionId, es);
    };

    ids.forEach(connect);

    return () => {
      idsRef.current = new Set();
      timeoutsRef.current.forEach((t) => {
        clearTimeout(t);
      });
      timeoutsRef.current.clear();
      ids.forEach((id) => {
        const es = connectionsRef.current.get(id);
        if (es) {
          es.close();
          connectionsRef.current.delete(id);
        }
      });
    };
  }, [auctionIds.join(','), queryClient, addReconnecting, removeReconnecting]);
}
