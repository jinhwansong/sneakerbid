/** 즉시 구매 응답 */
export interface BuyNowResponse {
  orderId: string;
  finalPrice: number;
  status: string;
}

/** 주문 결제 응답 */
export interface PayOrderResponse {
  orderId: string;
  status: string;
  paidAt: string;
}

/** 주문 항목 (내 주문 목록 응답) */
export interface OrderItem {
  id: string;
  auctionId: string;
  sneakerName: string;
  imageUrl: string;
  brand: string;
  finalPrice: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  paidAt: string | null;
}

/** 내 주문 목록 조회 응답 */
export type GetMyOrdersResponse = OrderItem[];
