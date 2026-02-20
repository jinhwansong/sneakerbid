/** SSE 이벤트 페이로드 - 상세 페이지 입찰 */
export interface NewBidPayload {
  id: string;
  user: string;
  amount: number;
  time: string;
  isBot?: boolean;
}

export type AuctionEventType = 'newBid' | 'auctionClosed' | 'ping';

export interface AuctionEventPayload {
  type: AuctionEventType;
  payload?: NewBidPayload;
}
