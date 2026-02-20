export type AuctionStatus =
  | 'ongoing'
  | 'ending_soon'
  | 'closed'
  | 'failed'   // 유찰
  | 'buy_now'; // 즉시구매 완료

export interface AuctionItem {
  id: string;
  modelName: string;
  brand: string;
  colorway?: string;       // 컬러웨이 (예: Black / Red)
  size?: number;           // 사이즈 mm (경매 단위, 단일 사이즈)
  styleCode?: string;      // 스타일코드 (예: DZ5485-612)
  releaseYear?: number;    // 출시연도
  condition?: string;      // 상품상태 (Deadstock, New with box 등)
  origin?: string;         // 제조국 (예: Vietnam, China)
  boxIncluded?: boolean;   // 박스 포함 여부
  description?: string;   // 상품 설명
  imageUrl: string;
  currentBid: number;
  buyNowPrice?: number;
  endTime: string; // ISO string
  participants: number;
  status: AuctionStatus;
  /** 로그인 시 API가 채워줌. 찜 여부 */
  isWishlisted?: boolean;
}

export interface BidLogItem {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
}

/** 찜하기: 유저별 경매 단위. API 응답/목록용 */
export interface WishlistEntry {
  id: string;
  auctionId: string;
  createdAt: string; // ISO
}

export interface AuctionHistoryItem {
  auctionId: string;
  imageUrl: string;
  brand: string;
  modelName: string;
  participants: number;
  finalPrice: number;
  date: string;
  status: 'completed' | 'cancelled';
}

export interface AuctionHistoryStats {
  tradesToday: number;
  averagePriceToday: number | null;
  maxPriceToday: number | null;
}

export interface AuctionHistoryResponse {
  stats: AuctionHistoryStats;
  items: AuctionHistoryItem[];
}
