import { WishlistItem, WishlistToggleResponse } from '@/types/wishlist';
import { apiClient } from './client';

export const wishlist = {
  /** 내 찜 목록 */
  getMy: () => apiClient.get<WishlistItem[]>('/wishlist/me'),

  /** 찜하기 토글 (PATCH) */
  toggle: (auctionId: string) =>
    apiClient.patch<WishlistToggleResponse>(`/wishlist/${auctionId}`, {}),
};
