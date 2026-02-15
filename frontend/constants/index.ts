import type { AuctionStatus } from '@/types/auction';

export const BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Asics', 'Yeezy'];

export const SIZES = Array.from({ length: 12 }, (_, i) => 240 + i * 5);

export const SORT_OPTIONS = [
  { label: '마감 임박순', value: 'ending_soon' },
  { label: '인기순', value: 'popular' },
  { label: '최신순', value: 'newest' },
  { label: '낮은 가격순', value: 'price_low' },
];

export const PERIOD_OPTIONS = [
  { label: '최근 1개월', value: '1m' },
  { label: '최근 3개월', value: '3m' },
  { label: '최근 6개월', value: '6m' },
  { label: '전체 기간', value: 'all' },
];

export const AUCTION_FILTER_TABS = ['전체', '인기', '종료임박', '신규'];

/** 메인/경매 목록 페이지용 상태 필터 (IA 4.1: 진행중 / 종료 / 유찰) */
export const MAIN_STATUS_FILTERS = ['진행중', '종료', '유찰'] as const;

/** 상태 필터와 실제 경매 상태 매핑 (IA 4.1) */
export const STATUS_MAP = {
  진행중: ['ongoing', 'ending_soon'],
  종료: ['closed', 'buy_now'],
  유찰: ['failed'],
} as const satisfies Record<(typeof MAIN_STATUS_FILTERS)[number], readonly AuctionStatus[]>;
