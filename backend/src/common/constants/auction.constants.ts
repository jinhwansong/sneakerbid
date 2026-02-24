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
] as const;

export const REFRESH_TTL = 7 * 24 * 60 * 60; // 7일(초)
