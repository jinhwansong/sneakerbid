import { useEffect, useMemo, useState } from 'react';
import { formatCountdown } from '@/lib/format';

/**
 * 경매 종료 시간까지의 카운트다운을 관리하는 훅
 * @param endTime - ISO 문자열 형식의 종료 시간
 * @returns 남은 초 수와 포맷된 카운트다운 문자열
 */
export const useCountdown = (endTime: string) => {
  const getRemainingSeconds = (endTime: string) =>
    Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(endTime)
  );

  const countdownLabel = useMemo(
    () => formatCountdown(remainingSeconds),
    [remainingSeconds]
  );

  const isExpired = remainingSeconds === 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(getRemainingSeconds(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  return {
    remainingSeconds,
    countdownLabel,
    isExpired,
  };
};
