import type {
  RefreshTokenResponse,
  LogoutResponse,
} from '@/types/auth';
import { apiClient } from './client';

/** 인증 관련 API */
export const auth = {
  /** 카카오 로그인 (리다이렉트) */
  kakao: () => {
    window.location.href = `${apiClient.getBaseUrl()}/auth/kakao`;
  },

  /** 구글 로그인 (리다이렉트) */
  google: () => {
    window.location.href = `${apiClient.getBaseUrl()}/auth/google`;
  },

  /** 리프레시 토큰 발급 */
  refresh: () => apiClient.get<RefreshTokenResponse>('/auth/refresh'),

  /** 로그아웃 */
  logout: () => apiClient.get<LogoutResponse>('/auth/logout'),
};






