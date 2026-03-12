import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsMounted } from '../../hooks/useIsMounted';
import { useMountedStore } from '@/store/useMountedStore';

describe('useIsMounted', () => {
  beforeEach(() => {
    useMountedStore.setState({ mounted: false });
  });

  it('마운트 후 mounted가 true를 반환한다', () => {
    const { result } = renderHook(() => useIsMounted());
    expect(result.current).toBe(true);
  });
});
