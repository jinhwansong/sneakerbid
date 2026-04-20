import { useEffect } from 'react';

/** `document.body` 스크롤을 막을 때 사용. `useClickOutside`와 달리 오버레이·모달용 스크롤 잠금 전용. */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
