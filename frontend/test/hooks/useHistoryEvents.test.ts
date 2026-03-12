import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHistoryEvents } from '@/hooks/useHistoryEvents';

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

describe('useHistoryEvents', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('newDeal 이벤트 시 onNewDeal이 호출된다', () => {
    const onNewDeal = vi.fn();
    renderHook(() =>
      useHistoryEvents({
        isActive: true,
        onNewDeal,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'newDeal',
        payload: {
          auctionId: 'a1',
          imageUrl: '',
          brand: 'Nike',
          modelName: 'Dunk',
          participants: 5,
          finalPrice: 150000,
          date: '2024-01-15',
          status: 'completed',
        },
      }),
    });
    mockEventSource.onmessage?.(event);

    expect(onNewDeal).toHaveBeenCalledWith({
      auctionId: 'a1',
      imageUrl: '',
      brand: 'Nike',
      modelName: 'Dunk',
      participants: 5,
      finalPrice: 150000,
      date: '2024-01-15',
      status: 'completed',
    });
  });

  it('statsUpdate 이벤트 시 onStatsUpdate가 호출된다', () => {
    const onStatsUpdate = vi.fn();
    renderHook(() =>
      useHistoryEvents({
        isActive: true,
        onNewDeal: vi.fn(),
        onStatsUpdate,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({ type: 'statsUpdate' }),
    });
    mockEventSource.onmessage?.(event);

    expect(onStatsUpdate).toHaveBeenCalled();
  });

  it('newBid 이벤트 시 onNewBid가 호출된다', () => {
    const onNewBid = vi.fn();
    renderHook(() =>
      useHistoryEvents({
        isActive: true,
        onNewDeal: vi.fn(),
        onNewBid,
      })
    );

    const event = new MessageEvent('message', {
      data: JSON.stringify({
        type: 'newBid',
        payload: {
          user: 'u1',
          modelName: 'Nike Dunk',
          amount: 100000,
          time: '방금 전',
        },
      }),
    });
    mockEventSource.onmessage?.(event);

    expect(onNewBid).toHaveBeenCalledWith({
      user: 'u1',
      modelName: 'Nike Dunk',
      amount: 100000,
      time: '방금 전',
    });
  });
});
