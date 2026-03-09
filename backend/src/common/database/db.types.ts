/** Shared DB types (replaces @prisma/client types) */

export type Role = 'USER' | 'ADMIN' | 'BOT';
export type OAuthProvider = 'GOOGLE' | 'KAKAO';
export type AuctionStatus = 'OPEN' | 'CLOSED';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
export type BidSourceType = 'USER' | 'BOT';
export type WalletTxType =
  | 'BID_HOLD'
  | 'BID_RELEASE'
  | 'PAYMENT'
  | 'REFUND'
  | 'ADJUSTMENT';
export type WalletRefType = 'AUCTION' | 'ORDER' | 'BID' | 'SYSTEM';

export type UserByIdResult = {
  id: string;
  nickname: string;
  role: string;
  balance: number;
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;
