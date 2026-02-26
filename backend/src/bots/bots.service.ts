import { Inject, Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { AuctionsService } from '@/auctions/auctions.service';
import { auctionCooldownKey, cooldownKey } from './cooldown.store';
import type { BotCooldownStore } from './cooldown.store';
import {
  AUCTION_COOLDOWN_SEC,
  BID_STAGGER_MS,
  BIDS_PER_TURN,
  BOT_COOLDOWN_MS,
  DAILY_TOPUP_RANGE_BY_TYPE,
  DEFAULT_RANGE,
  RELIST_AUCTION_DURATION_SEC,
  RELIST_DELAY_MAX_SEC,
  RELIST_DELAY_MIN_SEC,
} from '@/common/constant/bot.constants';
import { Auction, Bot } from '@prisma/client';

/** 랜덤 정수 생성 */
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 현재 시간이 구간인지 (24시간) */
function isWithinActivityHours(now: Date, start: number, end: number): boolean {
  const h = now.getHours();
  if (start <= end) return h >= start && h <= end;
  return h >= start || h <= end;
}

@Injectable()
export class BotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auctionsService: AuctionsService,
    @Inject('BOT_COOLDOWN_STORE')
    private readonly cooldownStore: BotCooldownStore,
  ) {}

  /** 매일 00:10 KST에 봇들에게 랜덤 잔액 지급 */
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
            void this.tryPlaceBid(auction, bot, now).then(resolve, () =>
              resolve(null),
            );
          }, delayMs),
      );
    });
    const results = await Promise.all(bidPromises);
    const placed = results.filter(
      (r): r is NonNullable<typeof r> => r !== null,
    );

    this.logPlacedBids(placed);
  }

  /** 봇 낙찰 경매 10~20초 후 재등록 (30초마다 체크) */
  @Interval(30_000)
  async relistBotWonAuctions() {
    const now = new Date();
    const minClosed = new Date(now.getTime() - RELIST_DELAY_MAX_SEC * 1000);
    const maxClosed = new Date(now.getTime() - RELIST_DELAY_MIN_SEC * 1000);

    const botUserIds = (
      await this.prisma.bot.findMany({ select: { userId: true } })
    ).map((b) => b.userId);
    if (botUserIds.length === 0) return;

    const alreadyRelistedIds = (
      await this.prisma.auction.findMany({
        where: { relistedFromAuctionId: { not: null } },
        select: { relistedFromAuctionId: true },
      })
    )
      .map((a) => a.relistedFromAuctionId)
      .filter((id): id is string => id != null);

    const toRelist = await this.prisma.auction.findMany({
      where: {
        status: 'CLOSED',
        winnerUserId: { in: botUserIds },
        closedAt: { gte: minClosed, lte: maxClosed },
        ...(alreadyRelistedIds.length > 0 && {
          id: { notIn: alreadyRelistedIds },
        }),
      },
      include: { sneaker: true },
    });

    for (const auction of toRelist) {
      if (!auction.winnerUserId) continue;
      const endTime = new Date(
        now.getTime() + RELIST_AUCTION_DURATION_SEC * 1000,
      );
      await this.prisma.auction.create({
        data: {
          sneakerId: auction.sneakerId,
          size: auction.size,
          startPrice: auction.currentPrice,
          currentPrice: auction.currentPrice,
          buyNowPrice: auction.buyNowPrice,
          minimumIncrement: auction.minimumIncrement,
          status: 'OPEN',
          endTime,
          sellerUserId: auction.winnerUserId,
          relistedFromAuctionId: auction.id,
        },
      });
      console.log(
        `[BotsService] 재등록: ${auction.sneaker.brand} ${auction.sneaker.modelName} (원본 ${auction.id})`,
      );
    }
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
    const [botVal, auctionVal] = await Promise.all([
      this.cooldownStore.get(cooldownKey(auctionId, botId)),
      this.cooldownStore.get(auctionCooldownKey(auctionId)),
    ]);
    return botVal === null && auctionVal === null;
  }

  /** 쿨다운 설정 (봇별 + 경매 전체) */
  private async setCooldown(auctionId: string, botId: string): Promise<void> {
    await Promise.all([
      this.cooldownStore.set(
        cooldownKey(auctionId, botId),
        String(Date.now()),
        Math.ceil(BOT_COOLDOWN_MS / 1000),
      ),
      this.cooldownStore.set(
        auctionCooldownKey(auctionId),
        String(Date.now()),
        AUCTION_COOLDOWN_SEC,
      ),
    ]);
  }

  /** 쿨다운 해제 (입찰 실패 시) */
  private async clearCooldown(auctionId: string, botId: string): Promise<void> {
    await Promise.all([
      this.cooldownStore.delete(cooldownKey(auctionId, botId)),
      this.cooldownStore.delete(auctionCooldownKey(auctionId)),
    ]);
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
    if (placed.length === 0) {
      console.log('[BotsService] 이번 턴 입찰 없음');
      return;
    }

    console.log(`[BotsService] ${placed.length}건 입찰 완료:`);
    for (const r of placed) {
      console.log(
        `  └─ ${r.bot} → ${r.item} | ₩${r.bidPrice.toLocaleString()}`,
      );
    }
  }

  /** 입찰 검증 (활동 시간, 브랜드, 판매자 제외) */
  private validateBid(
    auction: Auction & { sneaker: { brand: string }; sellerUserId: string },
    bot: Bot & { userId: string },
    now: Date,
  ): boolean {
    if (auction.sellerUserId === bot.userId) return false;
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
