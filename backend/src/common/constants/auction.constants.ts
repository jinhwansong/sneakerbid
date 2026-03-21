/** 마감 N초 전 입찰 시 연장 (soft close) */
export const SOFT_CLOSE_EXTEND_THRESHOLD_SEC = 10;
/** 연장 시 추가되는 시간 (분) */
export const SOFT_CLOSE_EXTEND_BY_MINUTES = 5;
/** 최대 연장 횟수 */
export const SOFT_CLOSE_MAX_EXTEND_COUNT = 3;

export const AUCTION_BRANDS = [
  'Nike',
  'Adidas',
  'New Balance',
  'Jordan',
  'Converse',
  'Puma',
  'Asics',
  'Vans',
  'Reebok',
  'Yeezy',
] as const;

export const AUCTION_SIZES = [
  '250',
  '255',
  '260',
  '265',
  '270',
  '275',
  '280',
  '285',
] as const;

export const SORT_OPTIONS = [
  'ending_soon',
  'popular',
  'newest',
  'price_low',
  'bid_count',
] as const;

export const REFRESH_TTL = 7 * 24 * 60 * 60; // 7일(초)

/** closeExpiredAuctions 배치 크기 (한 번에 처리할 최대 경매 수) */
export const CLOSE_EXPIRED_BATCH_SIZE = 50;

/** DB에 쌓인 post-close finalize 재시도 배치 크기 */
export const FINALIZE_RETRY_BATCH_SIZE = 20;

/** closeExpiredAuctions 전체 실행 타임아웃 (ms) */
export const CLOSE_EXPIRED_TIMEOUT_MS = 55_000; // cron 1분 주기이므로 55초
