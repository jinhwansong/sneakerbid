/**
 * 경매 관련 타입
 * API 계약 타입은 @shared/api-types에서 re-export, 프론트 전용 타입은 로컬 정의
 */
import type { AuctionStatus } from '@shared/api-types';

export type {
  AuctionStatus,
  CreateAuctionDto,
  UpdateAuctionDto,
  GetAuctionResponse,
  AuctionSummary,
  BidLogItem,
  PlaceBidDto,
  PlaceBidResponse,
  GetMainAuctionsResponse,
  GetAuctionListResponse,
  AuctionHistoryItem,
  AuctionHistoryStats,
  AuctionHistoryResponse,
  LiveStatsResponse,
} from '@shared/api-types';

/** 경매 아이템 (목록/상세 UI용, GetAuctionResponse 확장) */
export interface AuctionItem {
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
  startPrice?: number;
  currentBid: number;
  buyNowPrice?: number;
  endTime: string;
  participants: number;
  status: AuctionStatus;
  isWishlisted?: boolean;
  priceIncreasePercent?: string;
  winnerUserId?: string | null;
  minimumIncrement?: number;
}

/** 찜하기: 유저별 경매 단위 */
export interface WishlistEntry {
  id: string;
  auctionId: string;
  createdAt: string;
}

/** 경매 목록 조회 쿼리 파라미터 */
export interface AuctionListQuery {
  brand?: string;
  size?: string;
  status?: 'OPEN' | 'CLOSED';
  sort?: string;
  afterId?: string;
  limit?: number;
  search?: string;
}

/** 거래 내역 조회 쿼리 파라미터 */
export interface AuctionHistoryQuery {
  period?: '1d' | '3d' | '5d' | 'all';
  search?: string;
  limit?: number;
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
