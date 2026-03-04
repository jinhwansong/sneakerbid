import type { Auction, Sneaker } from '@prisma/client';

/** 상세 페이지용 (AuctionItem과 호환) */
export type AuctionDetail = {
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
  /** 시작가 대비 현재가 상승률 (%) */
  priceIncreasePercent: string;
  minimumIncrement: number;
};

export type AuctionSummary = {
  auctionId: string;
  sneakerName: string;
  brand: string;
  imageUrl: string;
  size: string;
  currentPrice: number;
  endTime: Date;
  status: 'OPEN' | 'CLOSED';
  bidCount?: number;
  buyNowPrice?: number | null;
  /** 낙찰자 ID (closed 시 won/lost 판별용) */
  winnerUserId?: string | null;
  closedAt?: Date | null;
  minimumIncrement: number;
};

export type AuctionWithDetails = Auction & {
  sneaker: Sneaker;
  _count?: { bids: number };
};

export type AuctionHistoryItem = {
  auctionId: string;
  imageUrl: string;
  brand: string;
  modelName: string;
  participants: number;
  finalPrice: number;
  date: string;
  status: 'completed' | 'cancelled';
};

export type AuctionHistoryStats = {
  tradesToday: number;
  averagePriceToday: number | null;
  maxPriceToday: number | null;
};

export type AuctionHistoryResponse = {
  stats: AuctionHistoryStats;
  items: AuctionHistoryItem[];
};

/** 입찰 시 경매 업데이트 데이터 (soft close 포함) */
export type BidUpdateData = {
  currentPrice: number;
  endTime?: Date;
  lastExtendedAt?: Date;
  extendCount?: number;
};
