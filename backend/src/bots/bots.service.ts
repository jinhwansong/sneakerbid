import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { AuctionRelistRepository } from '@/database/repositories/auction-relist.repository';
import {
  AuctionRepository,
  type AuctionListRow,
} from '@/database/repositories/auction.repository';
import { BotRepository } from '@/database/repositories/bot.repository';
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
  RELIST_CHECK_INTERVAL_SEC,
  RELIST_DELAY_MIN_SEC,
  RELIST_LOOKBACK_DAYS,
  BOT_SELLER_AUCTION_LIMIT,
  MERGED_AUCTIONS_FOR_BOTS,
} from '@/common/constants/bot.constants';

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

interface AuctionWithSneaker {
  id: string;
  sneakerId: string;
  size: string;
  startPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  sellerUserId: string;
  sneaker: { brand: string; modelName: string };
}

interface BotWithUser {
  id: string;
  userId: string;
  type: string;
  maxBidMultiplier: number;
  bidUnit: number;
  activityStartHour: number;
  activityEndHour: number;
  favoriteBrands: unknown;
  user: { id: string; nickname: string; balance: number };
}

@Injectable()
export class BotsService {
  constructor(
    private readonly auctionRepo: AuctionRepository,
    private readonly auctionRelistRepo: AuctionRelistRepository,
    private readonly botRepo: BotRepository,
    private readonly auctionsService: AuctionsService,
    @Inject('BOT_COOLDOWN_STORE')
    private readonly cooldownStore: BotCooldownStore,
  ) {}

  /** 매일 00:10 KST에 봇들에게 랜덤 잔액 지급 */
  @Cron('10 0 * * *', { timeZone: 'Asia/Seoul' })
  async dailyBotBalanceTopUp() {
    const bots = await this.botRepo.findAll();

    for (const bot of bots) {
      const [min, max] = DAILY_TOPUP_RANGE_BY_TYPE[bot.type] ?? DEFAULT_RANGE;
      const amount = randInt(min, max);
      await this.botRepo.incrementUserBalance(bot.userId, amount);
    }

    if (bots.length > 0) {
      console.log(
        `[BotsService] Daily top-up completed for ${bots.length} bots.`,
      );
    }
  }

  /** 봇 입찰 시도 (60초마다 — 프리티어 배포 시 CPU 부하 완화) */
  @Interval(60_000)
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

  /** 봇 낙찰 경매 재등록 (60초마다 — 최근 종료분 누락 없이 스캔) */
  @Interval(RELIST_CHECK_INTERVAL_SEC * 1000)
  async relistBotWonAuctions() {
    const now = new Date();
    const closedBefore = new Date(now.getTime() - RELIST_DELAY_MIN_SEC * 1000);
    const closedAfter = new Date(
      now.getTime() - RELIST_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );

    const botUserIds = await this.botRepo.findUserIds();
    if (botUserIds.length === 0) return;

    const alreadyRelistedIds = await this.botRepo.findRelistedAuctionIds();

    const toRelist = await this.auctionRepo.findClosedForRelist({
      botUserIds,
      closedAfter,
      closedBefore,
      excludeRelistedIds: alreadyRelistedIds,
    });

    const endTime = new Date(
      now.getTime() + RELIST_AUCTION_DURATION_SEC * 1000,
    );
    for (const auction of toRelist) {
      if (!auction.winnerUserId) continue;
      const id = randomUUID();
      const inserted = await this.auctionRelistRepo.insertAfterBotWin({
        id,
        sneakerId: auction.sneakerId,
        size: auction.size,
        currentPrice: auction.currentPrice,
        buyNowPrice: auction.buyNowPrice,
        minimumIncrement: auction.minimumIncrement,
        endTimeIso: endTime.toISOString(),
        sellerUserId: auction.winnerUserId,
        relistedFromAuctionId: auction.id,
      });
      if (inserted) {
        const brand = auction.sneaker_brand;
        const model = auction.sneaker_modelName;
        console.log(
          `[BotsService] 재등록: ${brand} ${model} (원본 ${auction.id})`,
        );
      }
    }
  }

  /** 경매·봇 데이터 조회 — 메인 풀 + 봇 판매자(재판매) 풀 합쳐 다른 봇이 입찰 가능하게 */
  private async fetchData(): Promise<[AuctionWithSneaker[], BotWithUser[]]> {
    const now = new Date();

    const [mainRows, botSellerRows, botRows] = await Promise.all([
      this.auctionRepo.findMainAuctions(now),
      this.auctionRepo.findOpenWithBotSeller(now, BOT_SELLER_AUCTION_LIMIT),
      this.botRepo.findWithUsers(),
    ]);

    const byId = new Map<string, AuctionListRow>();
    for (const r of botSellerRows) {
      byId.set(r.id, r);
    }
    for (const r of mainRows) {
      if (!byId.has(r.id)) byId.set(r.id, r);
    }
    const merged = Array.from(byId.values())
      .slice(0, MERGED_AUCTIONS_FOR_BOTS)
      .map((a) => ({
        ...a,
        sneaker: {
          brand: a.sneaker_brand,
          modelName: a.sneaker_modelName,
        },
      }));

    const auctions: AuctionWithSneaker[] = merged;

    const bots: BotWithUser[] = botRows.map((b) => ({
      id: b.id,
      userId: b.userId,
      type: b.type,
      maxBidMultiplier: b.maxBidMultiplier,
      bidUnit: b.bidUnit,
      activityStartHour: b.activityStartHour,
      activityEndHour: b.activityEndHour,
      favoriteBrands: b.favoriteBrands,
      user: {
        id: b.user_id,
        nickname: b.user_nickname,
        balance: b.user_balance,
      },
    }));

    return [auctions, bots];
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
    auction: AuctionWithSneaker,
    bot: BotWithUser,
    now: Date,
  ): Promise<{
    bot: string;
    item: string;
    auctionId: string;
    bidPrice: number;
  } | null> {
    const acquired = await this.cooldownStore.acquireCooldown(
      auction.id,
      bot.id,
      Math.ceil(BOT_COOLDOWN_MS / 1000),
      AUCTION_COOLDOWN_SEC,
    );
    if (!acquired) return null;
    try {
      if (!this.validateBid(auction, bot, now)) {
        await this.clearCooldown(auction.id, bot.id);
        return null;
      }
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
    auction: AuctionWithSneaker,
    bot: BotWithUser,
    now: Date,
  ): boolean {
    if (auction.sellerUserId === bot.userId) return false;
    if (
      !isWithinActivityHours(now, bot.activityStartHour, bot.activityEndHour)
    ) {
      return false;
    }
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
