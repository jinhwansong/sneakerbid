import { Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AuctionsService } from '@/auctions/auctions.service';

/** 봇별 일일 지급 범위 (타입별) - 단위: 원 */
const DAILY_TOPUP_RANGE_BY_TYPE: Record<string, [number, number]> = {
  AGGRESSIVE: [80_000, 150_000],
  CALCULATED: [50_000, 120_000],
  TROLL: [20_000, 60_000],
  EMOTIONAL: [40_000, 100_000],
  FOLLOWER: [50_000, 110_000],
};

const DEFAULT_RANGE: [number, number] = [30_000, 80_000];

/** 같은 경매에 같은 봇이 연속 입찰 시 최소 간격 (ms) */
const BOT_COOLDOWN_MS = 25_000;

/** 입찰 턴당 시도할 (경매, 봇) 쌍 수 - 병렬 처리 */
const BIDS_PER_TURN = 30;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 현재 시간이 activityStartHour~activityEndHour 구간인지 (24시간) */
function isWithinActivityHours(now: Date, start: number, end: number): boolean {
  const h = now.getHours();
  if (start <= end) return h >= start && h <= end;
  return h >= start || h <= end; // 야간 구간 (e.g. 22~06)
}

@Injectable()
export class BotsService {
  /** (auctionId:botId) → 마지막 입찰 시각 */
  private lastBidAt = new Map<string, number>();

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
      const [min, max] = DAILY_TOPUP_RANGE_BY_TYPE[bot.type] ?? DEFAULT_RANGE;
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
   * 20초마다 봇 입찰 시도
   */
  @Interval(20_000)
  async runBotBidding() {
    const now = new Date();
    const cooldownOk = (auctionId: string, botId: string) => {
      const key = `${auctionId}:${botId}`;
      const last = this.lastBidAt.get(key) ?? 0;
      if (Date.now() - last < BOT_COOLDOWN_MS) return false;
      return true;
    };
    const setCooldown = (auctionId: string, botId: string) => {
      this.lastBidAt.set(`${auctionId}:${botId}`, Date.now());
      // 오래된 엔트리 정리 (메모리 방지)
      if (this.lastBidAt.size > 500) {
        const cutoff = Date.now() - BOT_COOLDOWN_MS * 2;
        for (const [k, v] of this.lastBidAt) {
          if (v < cutoff) this.lastBidAt.delete(k);
        }
      }
    };

    const [auctions, bots] = await Promise.all([
      this.prisma.auction.findMany({
        where: { status: 'OPEN', endTime: { gt: now } },
        include: { sneaker: true },
        take: 15,
        orderBy: { endTime: 'asc' },
      }),
      this.prisma.bot.findMany({
        include: { user: true },
      }),
    ]);

    if (auctions.length === 0 || bots.length === 0) return;

    const attempts: { auction: (typeof auctions)[0]; bot: (typeof bots)[0] }[] =
      [];
    for (let i = 0; i < BIDS_PER_TURN; i++) {
      const auction = auctions[randInt(0, auctions.length - 1)];
      const bot = bots[randInt(0, bots.length - 1)];
      attempts.push({ auction, bot });
    }

    const bidPromises = attempts.map(async ({ auction, bot }) => {
      if (!cooldownOk(auction.id, bot.id)) return null;
      if (
        !isWithinActivityHours(now, bot.activityStartHour, bot.activityEndHour)
      )
        return null;

      const brands = (bot.favoriteBrands as string[]) ?? [];
      if (brands.length > 0 && !brands.includes(auction.sneaker.brand))
        return null;

      const minBid = auction.currentPrice + auction.minimumIncrement;
      const maxByMultiplier = Math.floor(
        auction.startPrice * bot.maxBidMultiplier,
      );
      const maxBid = Math.min(maxByMultiplier, bot.user.balance);

      if (minBid > maxBid) return null;

      const bidPrice =
        minBid + randInt(0, Math.min(bot.bidUnit, maxBid - minBid));
      if (bidPrice > maxBid) return null;

      const result = await this.auctionsService.placeBidAsBot(
        auction.id,
        bidPrice,
        { id: bot.userId, nickname: bot.user.nickname },
        bot.type,
      );

      if (result) {
        setCooldown(auction.id, bot.id);
        return {
          bot: bot.user.nickname,
          item: `${auction.sneaker.brand} ${auction.sneaker.modelName}`,
          auctionId: auction.id,
          bidPrice,
        };
      }
      return null;
    });

    const results = await Promise.all(bidPromises);
    const placed = results.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );

    for (const r of placed) {
      console.log(
        `[BotsService] ${r.bot} → ${r.item} | ${r.bidPrice.toLocaleString()}원`,
      );
    }
  }
}
