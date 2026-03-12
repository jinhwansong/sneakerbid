import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReconnectingEventSource } from '@/hooks/useReconnectingEventSource';

const mockEventSource = {
  close: vi.fn(),
  onmessage: null as ((e: MessageEvent) => void) | null,
  onerror: null as (() => void) | null,
  onopen: null as (() => void) | null,
};

const MockEventSourceConstructor = vi.fn(function (this: unknown, _url: string) {
  mockEventSource.onmessage = null;
  mockEventSource.onerror = null;
  mockEventSource.onopen = null;
  return mockEventSource;
});

beforeEach(() => {
  vi.useFakeTimers();
  MockEventSourceConstructor.mockClear();
  vi.stubGlobal('EventSource', MockEventSourceConstructor);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useReconnectingEventSource', () => {
  it('url과 enabled가 있으면 EventSource를 생성한다', () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useReconnectingEventSource('https://example.com/events', {
        onMessage,
        enabled: true,
      })
    );

    expect(MockEventSourceConstructor).toHaveBeenCalledWith(
      'https://example.com/events'
    );
  });

  it('url이 null이면 EventSource를 생성하지 않는다', () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useReconnectingEventSource(null, {
        onMessage,
        enabled: true,
      })
    );

    expect(MockEventSourceConstructor).not.toHaveBeenCalled();
  });

  it('enabled가 false면 EventSource를 생성하지 않는다', () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useReconnectingEventSource('https://example.com/events', {
        onMessage,
        enabled: false,
      })
    );

    expect(MockEventSourceConstructor).not.toHaveBeenCalled();
  });

  it('메시지 수신 시 onMessage가 호출된다', () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useReconnectingEventSource('https://example.com/events', {
        onMessage,
        enabled: true,
      })
    );

    const event = new MessageEvent('message', { data: '{"test":1}' });
    mockEventSource.onmessage?.(event);

    expect(onMessage).toHaveBeenCalledWith(event);
  });

  it('언마운트 시 EventSource를 닫는다', () => {
    const onMessage = vi.fn();
    const { unmount } = renderHook(() =>
      useReconnectingEventSource('https://example.com/events', {
        onMessage,
        enabled: true,
      })
    );

    unmount();

    expect(mockEventSource.close).toHaveBeenCalled();
  });
});
