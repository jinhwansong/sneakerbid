import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import type { UserByIdResult } from '@/common/database/db.types';
import type { MeWithStats } from './users.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly db: DatabaseService) {}

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
      throw new Error(`Failed to fetch bid count: ${bidRes.error.message}`);
    }
    if (orderRes.error) {
      this.logger.error(
        `getMeWithStats: Order count failed for userId=${userId}`,
        orderRes.error,
      );
      throw new Error(`Failed to fetch order count: ${orderRes.error.message}`);
    }
    if (auctionRes.error) {
      this.logger.error(
        `getMeWithStats: Auction count failed for userId=${userId}`,
        auctionRes.error,
      );
      throw new Error(`Failed to fetch auction count: ${auctionRes.error.message}`);
    }

    const bidCount = bidRes.count ?? 0;
    const wonCount = orderRes.count ?? 0;
    const soldCount = auctionRes.count ?? 0;

    return {
      ...user,
      stats: { bidCount, wonCount, soldCount },
    };
  }
}
