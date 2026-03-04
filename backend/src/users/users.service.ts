import { Injectable } from '@nestjs/common';
import { PrismaService, UserByIdResult } from '../prisma/prisma.service';

export type MeWithStats = NonNullable<UserByIdResult> & {
  stats: {
    bidCount: number;
    wonCount: number;
    soldCount: number;
  };
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserByIdResult> {
    return this.prisma.findUserById(id);
  }

  async getMeWithStats(userId: string): Promise<MeWithStats | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const [bidCount, wonCount, soldCount] = await Promise.all([
      this.prisma.bid.count({ where: { userId } }),
      this.prisma.order.count({
        where: { buyerUserId: userId, status: 'PAID' },
      }),
      this.prisma.auction.count({
        where: { sellerUserId: userId, status: 'CLOSED' },
      }),
    ]);

    return {
      ...user,
      stats: { bidCount, wonCount, soldCount },
    };
  }
}
