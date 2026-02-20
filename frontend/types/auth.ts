/** 리프레시 토큰 발급 응답 */
export interface RefreshTokenResponse {
  accessToken?: string;
}

/** 로그아웃 응답 */
export interface LogoutResponse {
  message: string;
}
