import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuctionEvents } from '@/hooks/useAuctionEvents';

const mockEventSource = {
  onmessage: null as ((e: MessageEvent) => void) | null,
  onerror: null as (() => void) | null,
  onopen: null as (() => void) | null,
  close: vi.fn(),
};

vi.mock('@/hooks/useReconnectingEventSource', () => ({
  useReconnectingEventSource: vi.fn(
    (
      _url: string | null,
      options: { onMessage: (e: MessageEvent) => void; enabled: boolean }
    ) => {
      mockEventSource.onmessage = options.onMessage;
      return undefined;
    }
  ),
}));

vi.mock('@/store/useSSEConnectionStore', () => ({
  useSSEConnectionStore: () => ({
    addReconnecting: vi.fn(),
    removeReconnecting: vi.fn(),
  }),
}));

describe('useAuctionEvents', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      ...process,
      env: { NEXT_PUBLIC_SITE_URL: 'https://example.com' },
    });
  });

  it('newBid 이벤트 시 onNewBid가 호출된다', () => {
    const onNewBid = vi.fn();
    renderHook(() =>
      useAuctionEvents({
        auctionId: 'a1',
        isActive: true,
        onNewBid,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'newBid',
        payload: {
          id: 'b1',
          user: 'u1',
          amount: 100000,
          time: '방금 전',
        },
      }),
    });
    mockEventSource.onmessage?.(event);

    expect(onNewBid).toHaveBeenCalledWith({
      id: 'b1',
      user: 'u1',
      amount: 100000,
      time: '방금 전',
    });
  });

  it('auctionClosed 이벤트 시 onAuctionClosed가 호출된다', () => {
    const onAuctionClosed = vi.fn();
    renderHook(() =>
      useAuctionEvents({
        auctionId: 'a1',
        isActive: true,
        onNewBid: vi.fn(),
        onAuctionClosed,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'auctionClosed',
        payload: {
          status: 'CLOSED',
          winnerUserId: 'u1',
          finalPrice: 150000,
        },
      }),
    });
    mockEventSource.onmessage?.(event);

    expect(onAuctionClosed).toHaveBeenCalledWith({
      status: 'CLOSED',
      winnerUserId: 'u1',
      finalPrice: 150000,
    });
  });

  it('buy_now 상태면 onAuctionClosed에 buy_now를 전달한다', () => {
    const onAuctionClosed = vi.fn();
    renderHook(() =>
      useAuctionEvents({
        auctionId: 'a1',
        isActive: true,
        onNewBid: vi.fn(),
        onAuctionClosed,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'auctionClosed',
        payload: {
          status: 'buy_now',
          winnerUserId: 'u1',
          finalPrice: 200000,
        },
      }),
    });
    mockEventSource.onmessage?.(event);

    expect(onAuctionClosed).toHaveBeenCalledWith({
      status: 'buy_now',
      winnerUserId: 'u1',
      finalPrice: 200000,
    });
  });

  it('잘못된 JSON이면 무시한다', () => {
    const onNewBid = vi.fn();
    renderHook(() =>
      useAuctionEvents({
        auctionId: 'a1',
        isActive: true,
        onNewBid,
      })
    );

    const event = new MessageEvent('message', { data: 'invalid json' });
    mockEventSource.onmessage?.(event);

    expect(onNewBid).not.toHaveBeenCalled();
  });
});
