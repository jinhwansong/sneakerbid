/** Supabase Auction row (buyNow용) */
export interface AuctionWithBuyNow {
  id: string;
  status: string;
  endTime: string;
  buyNowPrice: number | null;
  currentPrice: number;
}

/** Supabase Order + auction(sellerUserId) 조인 결과 */
export interface OrderWithAuction {
  id: string;
  auctionId: string;
  buyerUserId: string;
  finalPrice: number;
  status: string;
  auction: { sellerUserId: string } | Array<{ sellerUserId: string }>;
}

/** 결제 실패 시 재오픈용 주문 정보 */
export interface ReopenOrderPayload {
  id: string;
  auctionId: string;
  buyerUserId: string;
  finalPrice: number;
}

/** 내 주문 목록 아이템 */
export interface MyOrderItem {
  id: string;
  auctionId: string;
  sneakerName: string;
  imageUrl: string;
  brand: string;
  finalPrice: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
}
