import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRemainingTime } from '../../hooks/useRemainingTime';

describe('useRemainingTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('마운트 후 남은 시간을 HH:MM:SS로 반환한다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T14:30:45Z').toISOString();
    const { result } = renderHook(() => useRemainingTime(endTime));

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('02:30:45');
  });

  it('1초마다 갱신된다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T12:00:03Z').toISOString();
    const { result } = renderHook(() => useRemainingTime(endTime));

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(result.current).toBe('00:00:03');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('00:00:02');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current).toBe('00:00:00');
  });
});
