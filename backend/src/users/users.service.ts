import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { WalletRepository } from '@/database/repositories/wallet.repository';
import type { UserByIdResult } from '@/common/database/db.types';
import type { MeWithStats, SellerDashboard } from './users.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly walletRepo: WalletRepository,
  ) {}

  findById(id: string): Promise<UserByIdResult> {
    return this.db.findUserById(id);
  }

  async getMeWithStats(userId: string): Promise<MeWithStats | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const supabase = this.db.getSupabase();

    const [bidRes, orderRes, auctionRes] = await Promise.all([
      supabase
        .from('Bid')
        .select('id', { count: 'exact', head: true })
        .eq('userId', userId),
      supabase
        .from('Order')
        .select('id', { count: 'exact', head: true })
        .eq('buyerUserId', userId)
        .eq('status', 'PAID'),
      supabase
        .from('Auction')
        .select('id', { count: 'exact', head: true })
        .eq('sellerUserId', userId)
        .eq('status', 'CLOSED'),
    ]);

    if (bidRes.error) {
      this.logger.error(
        `getMeWithStats: Bid count failed for userId=${userId}`,
        bidRes.error,
      );
      throw new InternalServerErrorException('Failed to fetch bid count');
    }
    if (orderRes.error) {
      this.logger.error(
        `getMeWithStats: Order count failed for userId=${userId}`,
        orderRes.error,
      );
      throw new InternalServerErrorException('Failed to fetch order count');
    }
    if (auctionRes.error) {
      this.logger.error(
        `getMeWithStats: Auction count failed for userId=${userId}`,
        auctionRes.error,
      );
      throw new InternalServerErrorException('Failed to fetch auction count');
    }

    const bidCount = bidRes.count ?? 0;
    const wonCount = orderRes.count ?? 0;
    const soldCount = auctionRes.count ?? 0;

    const heldInBids = await this.walletRepo.sumActiveBidHoldAmount(userId);
    const balance = user.balance ?? 0;

    return {
      ...user,
      stats: { bidCount, wonCount, soldCount },
      wallet: {
        balance,
        heldInBids,
        totalBalance: balance + heldInBids,
      },
    };
  }

  /** 판매자 대시보드 요약 */
  async getSellerDashboard(userId: string): Promise<SellerDashboard> {
    const rows = await this.db.query<{
      auction_count: string;
      closed_count: string;
      bid_count: string;
      revenue: string;
      paid_orders: string;
      won_closed: string;
      views: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::text FROM "Auction" WHERE "sellerUserId" = $1) AS auction_count,
         (SELECT COUNT(*)::text FROM "Auction" WHERE "sellerUserId" = $1 AND status = 'CLOSED') AS closed_count,
         (SELECT COUNT(*)::text FROM "Bid" b JOIN "Auction" a ON b."auctionId" = a.id WHERE a."sellerUserId" = $1) AS bid_count,
         (SELECT COALESCE(SUM(o."finalPrice"), 0)::text FROM "Order" o JOIN "Auction" a ON o."auctionId" = a.id
            WHERE a."sellerUserId" = $1 AND o.status = 'PAID') AS revenue,
         (SELECT COUNT(*)::text FROM "Order" o JOIN "Auction" a ON o."auctionId" = a.id
            WHERE a."sellerUserId" = $1 AND o.status = 'PAID') AS paid_orders,
         (SELECT COUNT(*)::text FROM "Auction" WHERE "sellerUserId" = $1 AND status = 'CLOSED' AND "winnerUserId" IS NOT NULL) AS won_closed,
         (SELECT COALESCE(SUM("viewCount"), 0)::text FROM "Auction" WHERE "sellerUserId" = $1) AS views`,
      [userId],
    );
    const r = rows[0];
    const auctionCount = parseInt(r?.auction_count ?? '0', 10);
    const closedAuctionCount = parseInt(r?.closed_count ?? '0', 10);
    const bidCountOnMyAuctions = parseInt(r?.bid_count ?? '0', 10);
    const revenuePaid = parseInt(r?.revenue ?? '0', 10);
    const paidOrderCount = parseInt(r?.paid_orders ?? '0', 10);
    const wonClosed = parseInt(r?.won_closed ?? '0', 10);
    const viewCountSum = parseInt(r?.views ?? '0', 10);

    const sellThroughRate =
      closedAuctionCount > 0 ? wonClosed / closedAuctionCount : null;

    return {
      auctionCount,
      closedAuctionCount,
      bidCountOnMyAuctions,
      revenuePaid,
      paidOrderCount,
      sellThroughRate,
      viewCountSum,
    };
  }
}
