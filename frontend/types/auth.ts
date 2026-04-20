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
  stats?: {
    bidCount: number;
    wonCount: number;
    soldCount: number;
  };
  /** balance: 가용(입찰 보류 반영). heldInBids·totalBalance: 서버 확장 필드 */
  wallet?: {
    balance: number;
    heldInBids: number;
    totalBalance: number;
  };
}

/** GET /users/me/seller-dashboard */
export interface SellerDashboardResponse {
  auctionCount: number;
  closedAuctionCount: number;
  bidCountOnMyAuctions: number;
  revenuePaid: number;
  paidOrderCount: number;
  sellThroughRate: number | null;
  viewCountSum: number;
}
