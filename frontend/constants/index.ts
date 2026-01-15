export const BRANDS = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Asics', 'Yeezy'];

export const SIZES = Array.from({ length: 15 }, (_, i) => 230 + i * 5);

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
