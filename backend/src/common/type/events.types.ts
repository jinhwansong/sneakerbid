import type { AuctionHistoryItem } from './auction.type';

/** SSE 이벤트 페이로드 - 상세 페이지 입찰 */
export interface NewBidPayload {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
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
export type HistoryEventType = 'newDeal' | 'ping';

export interface HistoryEventPayload {
  type: HistoryEventType;
  payload?: AuctionHistoryItem;
}
