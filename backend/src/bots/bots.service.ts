import { Inject, Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AuctionsService } from '@/auctions/auctions.service';
import { cooldownKey } from './cooldown.store';
import type { BotCooldownStore } from './cooldown.store';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsService: AuctionsService,
    @Inject('BOT_COOLDOWN_STORE')
    private readonly cooldownStore: BotCooldownStore,
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
    const cooldownOk = async (
      auctionId: string,
      botId: string,
    ): Promise<boolean> => {
      const key = cooldownKey(auctionId, botId);
      const val = await this.cooldownStore.get(key);
      return val === null; // 키 없거나 만료됐으면 입찰 가능
    };
    const setCooldown = async (
      auctionId: string,
      botId: string,
    ): Promise<void> => {
      const key = cooldownKey(auctionId, botId);
      await this.cooldownStore.set(
        key,
        String(Date.now()),
        Math.ceil(BOT_COOLDOWN_MS / 1000),
      );
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
    const picked = new Set<string>();
    const maxPairs = auctions.length * bots.length;

    while (attempts.length < Math.min(BIDS_PER_TURN, maxPairs)) {
      const auction = auctions[randInt(0, auctions.length - 1)];
      const bot = bots[randInt(0, bots.length - 1)];
      const key = `${auction.id}:${bot.id}`;
      if (picked.has(key)) continue;
      picked.add(key);
      attempts.push({ auction, bot });
    }

    const clearCooldown = async (
      auctionId: string,
      botId: string,
    ): Promise<void> => {
      const key = cooldownKey(auctionId, botId);
      await this.cooldownStore.delete(key);
    };

    const bidPromises = attempts.map(async ({ auction, bot }) => {
      if (!(await cooldownOk(auction.id, bot.id))) return null;
      await setCooldown(auction.id, bot.id);
      try {
        if (
          !isWithinActivityHours(
            now,
            bot.activityStartHour,
            bot.activityEndHour,
          )
        ) {
          await clearCooldown(auction.id, bot.id);
          return null;
        }

        const brands = Array.isArray(bot.favoriteBrands)
          ? (bot.favoriteBrands as unknown[]).filter(
              (x): x is string => typeof x === 'string',
            )
          : [];
        if (brands.length > 0 && !brands.includes(auction.sneaker.brand)) {
          await clearCooldown(auction.id, bot.id);
          return null;
        }

        const minBid = auction.currentPrice + auction.minimumIncrement;
        const maxByMultiplier = Math.floor(
          auction.startPrice * bot.maxBidMultiplier,
        );
        const maxBid = Math.min(maxByMultiplier, bot.user.balance);

        if (minBid > maxBid) {
          await clearCooldown(auction.id, bot.id);
          return null;
        }

        const bidPrice =
          minBid + randInt(0, Math.min(bot.bidUnit, maxBid - minBid));

        const result = await this.auctionsService.placeBidAsBot(
          auction.id,
          bidPrice,
          { id: bot.userId, nickname: bot.user.nickname },
          bot.type,
        );

        if (result) {
          return {
            bot: bot.user.nickname,
            item: `${auction.sneaker.brand} ${auction.sneaker.modelName}`,
            auctionId: auction.id,
            bidPrice,
          };
        }
        await clearCooldown(auction.id, bot.id);
        return null;
      } catch {
        await clearCooldown(auction.id, bot.id);
        return null;
      }
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
