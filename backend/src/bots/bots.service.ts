import { Inject, Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AuctionsService } from '@/auctions/auctions.service';
import { cooldownKey } from './cooldown.store';
import type { BotCooldownStore } from './cooldown.store';
import { Auction, Bot } from '@prisma/client';

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

/** 각 입찰 시도 간 랜덤 지연 최대값 (ms) - 봇들이 동시에 움직이지 않도록 분산 */
const BID_STAGGER_MS = 18_000;

/** 랜덤 정수 생성 */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 현재 시간이 구간인지 (24시간) */
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

  /** 봇 입찰 시도 */
  @Interval(20_000)
  async runBotBidding() {
    const [auctions, bots] = await this.fetchData();
    if (auctions.length === 0 || bots.length === 0) return;

    const attempts = this.selectBidAttempts(auctions, bots);
    const now = new Date();

    const bidPromises = attempts.map(({ auction, bot }) => {
      const delayMs = randInt(0, BID_STAGGER_MS);
      return new Promise<Awaited<ReturnType<typeof this.tryPlaceBid>>>(
        (resolve) =>
          setTimeout(() => {
            void this.tryPlaceBid(auction, bot, now).then(resolve);
          }, delayMs),
      );
    });
    const results = await Promise.all(bidPromises);
    const placed = results.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );

    this.logPlacedBids(placed);
  }

  /** 경매·봇 데이터 조회 */
  private async fetchData() {
    const now = new Date();
    return Promise.all([
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
  }

  /** (auction, bot) 쌍 랜덤 추출, 최대 BIDS_PER_TURN개 */
  private selectBidAttempts<A extends { id: string }, B extends { id: string }>(
    auctions: A[],
    bots: B[],
  ): { auction: A; bot: B }[] {
    const attempts: { auction: A; bot: B }[] = [];
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
    return attempts;
  }

  /** 쿨다운 통과 여부 (키 없거나 만료 시 입찰 가능) */
  private async isCooldownOk(
    auctionId: string,
    botId: string,
  ): Promise<boolean> {
    const val = await this.cooldownStore.get(cooldownKey(auctionId, botId));
    return val === null;
  }

  /** 쿨다운 설정 */
  private async setCooldown(auctionId: string, botId: string): Promise<void> {
    await this.cooldownStore.set(
      cooldownKey(auctionId, botId),
      String(Date.now()),
      Math.ceil(BOT_COOLDOWN_MS / 1000),
    );
  }

  /** 쿨다운 해제 (입찰 실패 시) */
  private async clearCooldown(auctionId: string, botId: string): Promise<void> {
    await this.cooldownStore.delete(cooldownKey(auctionId, botId));
  }

  /** 입찰가 계산 (minBid~maxBid 범위 내 랜덤), 불가 시 null */
  private computeBidPrice(
    auction: {
      currentPrice: number;
      minimumIncrement: number;
      startPrice: number;
    },
    bot: {
      maxBidMultiplier: number;
      bidUnit: number;
      user: { balance: number };
    },
  ): number | null {
    const minBid = auction.currentPrice + auction.minimumIncrement;
    const maxByMultiplier = Math.floor(
      auction.startPrice * bot.maxBidMultiplier,
    );
    const maxBid = Math.min(maxByMultiplier, bot.user.balance);
    if (minBid > maxBid) return null;
    return minBid + randInt(0, Math.min(bot.bidUnit, maxBid - minBid));
  }

  /** 단일 입찰 시도: 쿨다운 → 검증 → 입찰 → 실패 시 쿨다운 해제 */
  private async tryPlaceBid(
    auction: Auction & { sneaker: { brand: string; modelName: string } },
    bot: Bot & { user: { id: string; nickname: string; balance: number } },
    now: Date,
  ): Promise<{
    bot: string;
    item: string;
    auctionId: string;
    bidPrice: number;
  } | null> {
    if (!(await this.isCooldownOk(auction.id, bot.id))) return null;
    await this.setCooldown(auction.id, bot.id);
    try {
      if (!this.validateBid(auction, bot, now)) return null;

      const bidPrice = this.computeBidPrice(auction, bot);
      if (bidPrice === null) {
        await this.clearCooldown(auction.id, bot.id);
        return null;
      }

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
      await this.clearCooldown(auction.id, bot.id);
      return null;
    } catch {
      await this.clearCooldown(auction.id, bot.id);
      return null;
    }
  }

  /** 입찰 성공 로그 출력 */
  private logPlacedBids(
    placed: { bot: string; item: string; bidPrice: number }[],
  ): void {
    for (const r of placed) {
      console.log(
        `[BotsService] ${r.bot} → ${r.item} | ${r.bidPrice.toLocaleString()}원`,
      );
    }
  }

  /** 입찰 검증 (활동 시간, 브랜드) */
  private validateBid(
    auction: Auction & { sneaker: { brand: string } },
    bot: Bot,
    now: Date,
  ): boolean {
    /** 활동 시간 체크 */
    if (
      !isWithinActivityHours(now, bot.activityStartHour, bot.activityEndHour)
    ) {
      return false;
    }
    /** 브랜드 체크 */
    const brands = Array.isArray(bot.favoriteBrands)
      ? (bot.favoriteBrands as unknown[]).filter(
          (x): x is string => typeof x === 'string',
        )
      : [];
    if (brands.length > 0 && !brands.includes(auction.sneaker.brand)) {
      return false;
    }

    return true;
  }
}
