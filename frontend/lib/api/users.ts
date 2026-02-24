import type { MeResponse } from '@/types/auth';
import { Fetcher } from '../fetcher';

export const users = {
  /** 현재 로그인한 사용자 정보 (쿠키 인증) */
  getMe: () => Fetcher<MeResponse>(`${process.env.NEXT_PUBLIC_SITE_URL}/users/me`),
};
