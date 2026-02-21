import type { MeResponse } from '@/types/auth';
import { API_BASE_URL } from '../config';
import { Fetcher } from '../fetcher';

export const users = {
  /** 현재 로그인한 사용자 정보 (쿠키 인증) */
  getMe: () => Fetcher<MeResponse>(`${API_BASE_URL}/users/me`),
};
