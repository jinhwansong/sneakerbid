/**
 * 숫자를 한국 원화 형식으로 포맷팅합니다.
 * @param price - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: 580,000원)
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price).replace('₩', '');
};

/**
 * ISO 날짜 문자열로부터 남은 시간을 HH:MM:SS 형식으로 계산합니다.
 * @param endTime - 종료 시간 ISO 문자열
 * @returns 남은 시간 문자열 (예: 02:14:55)
 */
export const formatRemainingTime = (endTime: string): string => {
  const totalSeconds = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};

export const formatTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

/**
 * ISO 날짜 문자열 또는 Date를 한국어 형식으로 포맷팅합니다.
 * @param isoString - ISO 8601 날짜 문자열 또는 Date
 * @returns 포맷팅된 문자열 (예: 2024년 1월 15일), 유효하지 않으면 '-'
 */
export const formatJoinDate = (isoString: string | Date | undefined): string => {
  if (isoString == null || isoString === '') return '-';
  const date = isoString instanceof Date ? isoString : new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCountdown = (totalSeconds: number) => {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    '0'
  );
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};
