import type { MeResponse, SellerDashboardResponse } from '@/types/auth';
import type { PublicReviewsResponse } from '@/types/reviews';
import { apiClient } from './client';

export const users = {
  /** 현재 로그인한 사용자 정보 (쿠키 인증) */
  getMe: () => apiClient.get<MeResponse>('/users/me'),

  getSellerDashboard: () =>
    apiClient.get<SellerDashboardResponse>('/users/me/seller-dashboard'),

  getUserReviews: (userId: string) =>
    apiClient.get<PublicReviewsResponse>(`/users/${userId}/reviews`),
};

