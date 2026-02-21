/** 리프레시 토큰 발급 응답 */
export interface RefreshTokenResponse {
  accessToken?: string;
}

/** 로그아웃 응답 */
export interface LogoutResponse {
  message: string;
}

/** 내 정보 (GET /users/me) 응답 */
export interface MeResponse {
  id: string;
  nickname: string;
  role: string;
  balance: number;
  profileImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}
