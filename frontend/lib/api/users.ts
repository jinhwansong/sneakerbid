import type { MeResponse } from '@/types/auth';
import { apiClient } from './client';

export const users = {
  /** 현재 로그인한 사용자 정보 (쿠키 인증) */
  getMe: () => apiClient.get<MeResponse>('/users/me'),
};

