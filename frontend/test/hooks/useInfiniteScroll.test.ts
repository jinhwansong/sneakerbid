import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('초기에 pageSize만큼만 items를 반환한다', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8];
    const { result } = renderHook(() =>
      useInfiniteScroll({ data, pageSize: 3 })
    );

    expect(result.current.items).toEqual([1, 2, 3]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('loadMore 호출 시 다음 pageSize만큼 추가한다', () => {
    const data = [1, 2, 3, 4];
    const { result } = renderHook(() =>
      useInfiniteScroll({ data, pageSize: 2, delayMs: 100 })
    );

    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });
    expect(result.current.isLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.items).toEqual([1, 2, 3, 4]);
    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.loadMore();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.items).toEqual([1, 2, 3, 4]);
    expect(result.current.hasMore).toBe(false);
  });

  it('reset 호출 시 초기 상태로 돌아간다', () => {
    const data = [1, 2, 3, 4, 5];
    const { result } = renderHook(() =>
      useInfiniteScroll({ data, pageSize: 2, delayMs: 100 })
    );

    act(() => {
      result.current.loadMore();
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.items).toEqual([1, 2, 3, 4]);

    act(() => {
      result.current.reset();
    });
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('isLoading이거나 hasMore가 false면 loadMore는 무시된다', () => {
    const data = [1, 2];
    const { result } = renderHook(() =>
      useInfiniteScroll({ data, pageSize: 2, delayMs: 100 })
    );

    expect(result.current.hasMore).toBe(false);
    act(() => {
      result.current.loadMore();
    });
    expect(result.current.items).toEqual([1, 2]);
  });
});
