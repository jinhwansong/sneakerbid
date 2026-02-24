import type {
  BuyNowResponse,
  PayOrderResponse,
  GetMyOrdersResponse,
} from '@/types/orders';
import { Fetcher } from '../fetcher';

export const orders = {
  /** 내 주문 목록 조회 */
  getMyOrders: () =>
    Fetcher<GetMyOrdersResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/orders/me`),

  /** 즉시 구매 */
  buyNow: (auctionId: string) =>
    Fetcher<BuyNowResponse>(
      `${process.env.NEXT_PUBLIC_SITE_URL}/orders/buy-now/${auctionId}`,
      { method: 'POST' }
    ),

  /** 주문 결제 */
  pay: (orderId: string) =>
    Fetcher<PayOrderResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/orders/${orderId}/pay`, {
      method: 'POST',
    }),
};
