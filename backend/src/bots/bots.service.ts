import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AuctionsService } from '@/auctions/auctions.service';
import {
  DAILY_TOPUP_RANGE_BY_TYPE,
  DEFAULT_TOPUP_RANGE,
} from '@/common/constants/bot.constants';

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[randInt(0, arr.length - 1)];
}

@Injectable()
export class BotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsService: AuctionsService,
  ) {}

  /**
   * 매일 00:10 KST에 봇들에게 랜덤 잔액 지급
   */
  @Cron('10 0 * * *', { timeZone: 'Asia/Seoul' })
  async dailyBotBalanceTopUp() {
    const bots = await this.prisma.bot.findMany({
      include: { user: true },
    });

    for (const bot of bots) {
      const [min, max] =
        DAILY_TOPUP_RANGE_BY_TYPE[bot.type] ?? DEFAULT_TOPUP_RANGE;
      const amount = randInt(min, max);

      await this.prisma.user.update({
        where: { id: bot.userId },
        data: { balance: { increment: amount } },
      });
    }

    if (bots.length > 0) {
      console.log(
        `[BotsService] Daily top-up completed for ${bots.length} bots.`,
      );
    }
  }

  /**
   * 매 30초마다 봇 입찰 시뮬레이션
   * - 활동 시간대 봇만 참여
   * - 잔액이 minBid 이상인 봇만 입찰
   * - 선호 브랜드 우선 (선택적)
   */
  @Cron('*/30 * * * * *', { timeZone: 'Asia/Seoul' })
  async runBidSimulation() {
    const now = new Date();
    const hour = now.getHours();

    const [auctions, bots] = await Promise.all([
      this.prisma.auction.findMany({
        where: {
          status: 'OPEN',
          endTime: { gt: now },
        },
        include: { sneaker: true },
        take: 20,
      }),
      this.prisma.bot.findMany({
        where: {
          user: { balance: { gt: 0 } },
          activityStartHour: { lte: hour },
          activityEndHour: { gte: hour },
        },
        include: { user: true },
      }),
    ]);

    if (auctions.length === 0 || bots.length === 0) return;

    const auction = pickRandom(auctions);
    const bot = pickRandom(bots);
    if (!auction || !bot) return;

    const minBid = auction.currentPrice + auction.minimumIncrement;
    const maxBid = Math.floor(auction.startPrice * bot.maxBidMultiplier);
    if (minBid > maxBid || bot.user.balance < minBid) return;

    const favoriteBrands = (bot.favoriteBrands as string[]) ?? [];
    const brandMatch =
      favoriteBrands.length === 0 ||
      favoriteBrands.some(
        (b) => b.toLowerCase() === auction.sneaker.brand.toLowerCase(),
      );
    if (!brandMatch) return;

    const increment = Math.max(
      auction.minimumIncrement,
      bot.bidUnit ?? auction.minimumIncrement,
    );
    const bidPrice = Math.min(
      minBid + randInt(0, 2) * increment,
      maxBid,
      bot.user.balance,
    );

    await this.auctionsService.placeBidAsBot(
      auction.id,
      bidPrice,
      bot.userId,
      bot.user.nickname,
      bot.type,
    );
  }
}
