import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('종료 시간까지 남은 초와 라벨을 반환한다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T12:00:05Z').toISOString();
    const { result } = renderHook(() => useCountdown(endTime));

    expect(result.current.remainingSeconds).toBe(5);
    expect(result.current.countdownLabel).toBe('00:00:05');
    expect(result.current.isExpired).toBe(false);
  });

  it('1초마다 갱신된다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T12:00:03Z').toISOString();
    const { result } = renderHook(() => useCountdown(endTime));

    expect(result.current.remainingSeconds).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('이미 지난 시간이면 isExpired가 true이다', () => {
    const base = new Date('2024-01-15T12:00:00Z');
    vi.setSystemTime(base);

    const endTime = new Date('2024-01-15T11:59:00Z').toISOString();
    const { result } = renderHook(() => useCountdown(endTime));

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.countdownLabel).toBe('00:00:00');
  });
});
