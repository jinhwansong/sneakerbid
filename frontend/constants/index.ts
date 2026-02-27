import type { AuctionStatus } from '@/types/auction';

export const BRANDS = [
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
];

export const SIZES = Array.from({ length: 8 }, (_, i) => 250 + i * 5);

export const SORT_OPTIONS = [
  { label: '인기순', value: 'popular' },
  { label: '최신순', value: 'newest' },
  { label: '입찰순', value: 'bid_count' },
  { label: '낮은 가격순', value: 'price_low' },
  { label: '마감 임박순', value: 'ending_soon' },
];

export const PERIOD_OPTIONS = [
  { label: '전체 기간', value: 'all' },
  { label: '최근 1개월', value: '1m' },
  { label: '최근 3개월', value: '3m' },
  { label: '최근 6개월', value: '6m' },
];

export const AUCTION_FILTER_TABS = ['전체', '인기', '종료임박', '신규'];

/** 메인/경매 목록 페이지용 상태 필터 (IA 4.1: 진행중 / 종료) */
export const MAIN_STATUS_FILTERS = ['진행중', '종료'] as const;

/** 상태 필터와 실제 경매 상태 매핑 (IA 4.1) */
export const STATUS_MAP = {
  진행중: ['ongoing', 'ending_soon'],
  종료: ['closed', 'buy_now'],
} as const satisfies Record<(typeof MAIN_STATUS_FILTERS)[number], readonly AuctionStatus[]>;




