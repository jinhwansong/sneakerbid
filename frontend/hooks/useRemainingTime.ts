'use client';

import { useState, useEffect } from 'react';
import { formatRemainingTime } from '@/lib/util/format';

/** 마운트 후 1초마다 갱신되는 남은 시간. 하이드레이션 시에는 "—" 반환 */
export function useRemainingTime(endTime: string): string {
  const [remaining, setRemaining] = useState('—');

  useEffect(() => {
    const update = () => {
      const s = formatRemainingTime(endTime);
      setRemaining(s);
      return s === '00:00:00';
    };
    if (update()) return;
    const id = setInterval(() => {
      if (update()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return remaining;
}
