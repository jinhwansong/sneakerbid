/** auctionClosed SSE 이벤트 페이로드 */
export interface AuctionClosedPayload {
  status: 'CLOSED' | 'buy_now';
  winnerUserId: string | null;
  finalPrice: number;
}
