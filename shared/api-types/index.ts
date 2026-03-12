/**
 * API 공통 타입 정의 (Backend/Frontend 단일 소스)
 * 경매, 주문, 입찰 등 API 요청/응답 스키마
 */

/** 경매 상태 */
export type AuctionStatus =
  | 'ongoing'
  | 'ending_soon'
  | 'closed'
  | 'failed'
  | 'buy_now';

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

/** 경매 수정 요청 (모든 필드 선택) */
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

/** 경매 상세 응답 */
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
  status: AuctionStatus;
  isWishlisted?: boolean;
  priceIncreasePercent: string;
  minimumIncrement?: number;
}

/** 경매 요약 (목록용) */
export interface AuctionSummary {
  auctionId: string;
  sneakerName: string;
  brand: string;
  imageUrl: string;
  size: string;
  currentPrice: number;
  endTime: string;
  status: 'OPEN' | 'CLOSED' | 'FAILED' | 'BUY_NOW';
  bidCount?: number;
  buyNowPrice?: number | null;
  winnerUserId?: string | null;
  closedAt?: string | null;
  minimumIncrement?: number;
  isWishlisted?: boolean;
}

/** 입찰 로그 아이템 */
export interface BidLogItem {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
  participantCount?: number;
}

/** 입찰 요청 */
export interface PlaceBidDto {
  bidPrice: number;
}

/** 입찰 응답 */
export interface PlaceBidResponse {
  bidId: string;
  currentPrice: number;
}

/** 메인 경매 목록 응답 */
export interface GetMainAuctionsResponse {
  ongoing: AuctionSummary[];
}

/** 경매 목록 조회 응답 */
export interface GetAuctionListResponse {
  items: AuctionSummary[];
  nextCursor: string | null;
  hasMore: boolean;
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

/** 실시간 마켓 지표 */
export interface LiveStatsResponse {
  activeBidders: number;
  activeAuctions: number;
  volume24h: number;
  avgBidSpeedSeconds: number;
}
