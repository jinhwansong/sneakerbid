/** 경매 상태 */
export type AuctionStatus =
  | 'ongoing'
  | 'ending_soon'
  | 'closed'
  | 'failed'   // 유찰
  | 'buy_now'; // 즉시구매 완료

/** 경매 아이템 (목록/상세에서 사용) */
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
  startPrice?: number;     // 상세 API에서 제공 (시작가)
  currentBid: number;
  buyNowPrice?: number;
  endTime: string; // ISO string
  participants: number;
  status: AuctionStatus;
  /** 로그인 시 API가 채워줌. 찜 여부 */
  isWishlisted?: boolean;
  /** 상세 API에서 제공: 시작가 대비 현재가 상승률 (%) */
  priceIncreasePercent?: string;
  /** 낙찰자 ID (closed 시 won/lost 판별용) */
  winnerUserId?: string | null;
  /** 최소 입찰 단위 (서버 검증용, 없으면 10000 사용) */
  minimumIncrement?: number;
}

/** 입찰 로그 아이템 */
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

/** 거래 내역 아이템 */
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

/** 거래 내역 통계 */
export interface AuctionHistoryStats {
  tradesToday: number;
  averagePriceToday: number | null;
  maxPriceToday: number | null;
}

/** 거래 내역 응답 */
export interface AuctionHistoryResponse {
  stats: AuctionHistoryStats;
  items: AuctionHistoryItem[];
}

/** 실시간 마켓 지표 (LiveStats) */
export interface LiveStatsResponse {
  activeBidders: number;
  activeAuctions: number;
  volume24h: number;
  avgBidSpeedSeconds: number;
}

/** 경매 목록 조회 쿼리 파라미터 */
export interface AuctionListQuery {
  brand?: string;
  size?: string;
  status?: 'OPEN' | 'CLOSED';
  sort?: string;
  afterId?: string;
  limit?: number;
}

/** 거래 내역 조회 쿼리 파라미터 */
export interface AuctionHistoryQuery {
  period?: '1m' | '3m' | '6m' | 'all';
  search?: string;
  limit?: number;
}

/** 경매 등록 요청 */
export interface CreateAuctionDto {
  modelName: string;
  brand: string;
  color: string;
  description: string;
  imageUrl: string;
  size: string;
  startPrice: number;
  buyNowPrice?: number;
  minimumIncrement: number;
  endTime: string;
}

/** 경매 수정 요청 DTO (모든 필드 선택적) */
export interface UpdateAuctionDto {
  imageUrl?: string;
  name?: string;
  brand?: string;
  color?: string;
  description?: string;
  size?: string;
  startPrice?: number;
  buyNowPrice?: number;
  minimumIncrement?: number;
  endTime?: string;
}

/** 경매 요약 정보 (목록에서 사용) */
export interface AuctionSummary {
  auctionId: string;
  sneakerName: string;
  brand: string;
  imageUrl: string;
  size: string;
  currentPrice: number;
  endTime: string; // ISO string
  status: 'OPEN' | 'CLOSED' | 'FAILED' | 'BUY_NOW';
  bidCount?: number;
  buyNowPrice?: number | null;
  /** 낙찰자 ID (closed 시 won/lost 판별용) */
  winnerUserId?: string | null;
  closedAt?: string | null; // ISO string
  /** 최소 입찰 단위 (서버 검증용) */
  minimumIncrement?: number;
}

/** 메인 경매 목록 응답 */
export interface GetMainAuctionsResponse {
  ongoing: AuctionSummary[];
  closed: AuctionSummary[];
}

/** 경매 목록 조회 응답 (페이지네이션 포함) */
export interface GetAuctionListResponse {
  items: AuctionSummary[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** 경매 등록 응답 */
export interface CreateAuctionResponse {
  id: string;
  sneakerId: string;
  sellerUserId: string;
  startPrice: number;
  currentPrice: number;
  buyNowPrice: number | null;
  minimumIncrement: number;
  status: 'OPEN' | 'CLOSED';
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

/** 경매 수정 응답 */
export interface UpdateAuctionResponse {
  id: string;
}

/** 경매 삭제 응답 */
export interface DeleteAuctionResponse {
  message: string;
}

/** 경매 상세 조회 응답 */
export interface GetAuctionResponse {
  id: string;
  modelName: string;
  brand: string;
  colorway?: string;
  size?: number;
  styleCode?: string;
  releaseYear?: number;
  condition?: string;
  origin?: string;
  boxIncluded?: boolean;
  description?: string;
  imageUrl: string;
  startPrice: number;
  currentBid: number;
  buyNowPrice?: number | null;
  endTime: string;
  participants: number;
  status: 'ongoing' | 'ending_soon' | 'closed' | 'failed' | 'buy_now';
  isWishlisted?: boolean;
  priceIncreasePercent: string;
  minimumIncrement?: number;
}

/** 입찰 요청 DTO */
export interface PlaceBidDto {
  bidPrice: number;
}

/** 입찰 응답 */
export interface PlaceBidResponse {
  bidId: string;
  currentPrice: number;
}

