import type { UserByIdResult } from '@/common/database/db.types';

export type MeWithStats = NonNullable<UserByIdResult> & {
  stats: {
    bidCount: number;
    wonCount: number;
    soldCount: number;
  };
  /** balance: 가용 잔액(입찰 보류 반영). heldInBids: 입찰 보류 합계. totalBalance: 총 자산(가용+보류) */
  wallet: {
    balance: number;
    heldInBids: number;
    totalBalance: number;
  };
};

export type SellerDashboard = {
  /** 진행 중 + 종료 포함 내가 등록한 경매 수 */
  auctionCount: number;
  /** 종료된 경매 수 */
  closedAuctionCount: number;
  /** 내 경매에 달린 입찰 수 */
  bidCountOnMyAuctions: number;
  /** 결제 완료 매출 합계 */
  revenuePaid: number;
  /** 낙찰되어 결제 완료된 건수 */
  paidOrderCount: number;
  /** 종료 경매 중 낙찰(주문 생성) 비율 */
  sellThroughRate: number | null;
  /** 조회수 합계 (상세 진입 시 누적) */
  viewCountSum: number;
};
