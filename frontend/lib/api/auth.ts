import type {
  RefreshTokenResponse,
  LogoutResponse,
} from '@/types/auth';
import { Fetcher } from '../fetcher';
import { API_BASE_URL } from '../config';

/** 인증 관련 API */
export const auth = {
  /** 카카오 로그인 (리다이렉트) */
  kakao: () => {
    window.location.href = `${API_BASE_URL}/auth/kakao`;
  },

  /** 구글 로그인 (리다이렉트) */
  google: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  /** 리프레시 토큰 발급 */
  refresh: () => Fetcher<RefreshTokenResponse>(`${API_BASE_URL}/auth/refresh`),

  /** 로그아웃 */
  logout: () => Fetcher<LogoutResponse>(`${API_BASE_URL}/auth/logout`),
};


