import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import type { UserByIdResult } from '@/common/database/db.types';
import type { MeWithStats } from './users.types';

@Injectable()
export class UsersService {
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

    const bidCount = bidRes.count ?? 0;
    const wonCount = orderRes.count ?? 0;
    const soldCount = auctionRes.count ?? 0;

    return {
      ...user,
      stats: { bidCount, wonCount, soldCount },
    };
  }
}
