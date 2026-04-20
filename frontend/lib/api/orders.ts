import type {
  BuyNowResponse,
  PayOrderResponse,
  GetMyOrdersResponse,
} from '@/types/orders';
import { apiClient } from './client';

export const orders = {
  /** 내 주문 목록 조회 */
  getMyOrders: () =>
    apiClient.get<GetMyOrdersResponse>('/orders/me'),

  /** 즉시 구매 */
  buyNow: (auctionId: string) =>
    apiClient.post<BuyNowResponse>(`/orders/buy-now/${auctionId}`),

  /** 주문 결제 */
  pay: (orderId: string) =>
    apiClient.post<PayOrderResponse>(`/orders/${orderId}/pay`),

  /** 거래 후 리뷰 */
  createReview: (
    orderId: string,
    body: { rating: number; comment?: string },
  ) =>
    apiClient.post<{ id: string; orderId: string; targetUserId: string; rating: number }>(
      `/orders/${orderId}/reviews`,
      body,
    ),
};
