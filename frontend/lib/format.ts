/**
 * 숫자를 한국 원화 형식으로 포맷팅합니다.
 * @param price - 포맷팅할 금액
 * @returns 포맷팅된 문자열 (예: 580,000원)
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(price).replace('₩', '') + '원';
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
