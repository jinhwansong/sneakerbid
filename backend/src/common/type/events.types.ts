import type { AuctionHistoryItem } from './auction.type';

/** SSE 이벤트 페이로드 - 상세 페이지 입찰 */
export interface NewBidPayload {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
  /** 입찰 수 (bid count). 있으면 클라이언트가 절대값으로 사용 */
  participantCount?: number;
}

export type AuctionEventType = 'newBid' | 'auctionClosed' | 'ping';

/** auctionClosed 이벤트 페이로드 */
export interface AuctionClosedPayload {
  status: 'CLOSED' | 'buy_now';
  winnerUserId: string | null;
  finalPrice: number;
}

export interface AuctionEventPayload {
  type: AuctionEventType;
  payload?: NewBidPayload | AuctionClosedPayload;
}

/** 거래내역 SSE - 새 체결 시 */
export type HistoryEventType = 'newDeal' | 'newBid' | 'ping';

/** LiveActivityFeed용 입찰 이벤트 (history 채널 브로드캐스트) */
export interface RecentBidPayload {
  user: string;
  modelName: string;
  amount: number;
  time: string;
}

export interface HistoryEventPayload {
  type: HistoryEventType;
  payload?: AuctionHistoryItem | RecentBidPayload;
}
