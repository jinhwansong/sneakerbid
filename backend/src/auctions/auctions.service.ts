import { DatabaseService } from '@/database/database.service';
import { AuctionRepository } from '@/database/repositories/auction.repository';
import { BidRepository } from '@/database/repositories/bid.repository';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAuctionDto } from './dto/create.auction.dto';
import { AuctionListQueryDto } from './dto/auction.list.query.dto';
import {
  AuctionHistoryQueryDto,
  AuctionHistoryPeriod,
} from './dto/auction.history.query.dto';
import { AUCTION_BRANDS, AUCTION_SIZES } from '@/common/enum/auction.enum';
import { UserRole } from '@/common/enum/role.enum';
import {
  AuctionDetail,
  AuctionHistoryItem,
  AuctionHistoryResponse,
  AuctionSummary,
  AuctionWithDetails,
  BidUpdateData,
} from '@/common/type/auction.type';
import { UpdateAuctionDto } from './dto/update.auction.dto';
import { PlaceBidDto } from './dto/place.bid.dto';
import { RequestUser } from '@/common/decorator/user.decorator';
import { EventsService } from '@/events/events.service';
import { BidLogItem } from '@/common/type/bot.type';
import { WalletService } from '@/wallet/wallet.service';
import { WishlistService } from '@/wishlist/wishlist.service';
import { lockAuctionForUpdate } from './auction-lock.helper';
import {
  SOFT_CLOSE_EXTEND_BY_MINUTES,
  SOFT_CLOSE_EXTEND_THRESHOLD_SEC,
  SOFT_CLOSE_MAX_EXTEND_COUNT,
} from '@/common/constants/auction.constants';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auctionRepo: AuctionRepository,
    private readonly bidRepo: BidRepository,
    private readonly eventsService: EventsService,
    private readonly walletService: WalletService,
    private readonly wishlistService: WishlistService,
  ) {}

  /**
   * 입찰 시 업데이트 데이터 (soft close: 마감 10초 전 입찰 시 5분 연장, 최대 3회)
   */
  private buildBidUpdateData(
    auction: { endTime: Date; extendCount?: number },
    now: Date,
    bidPrice: number,
  ): BidUpdateData {
    const data: BidUpdateData = {
      currentPrice: bidPrice,
    };

    const msUntilEnd = new Date(auction.endTime).getTime() - now.getTime();
    const extendCount = auction.extendCount ?? 0;

    if (
      msUntilEnd <= SOFT_CLOSE_EXTEND_THRESHOLD_SEC * 1000 &&
      extendCount < SOFT_CLOSE_MAX_EXTEND_COUNT
    ) {
      const newEndTime = new Date(auction.endTime);
      newEndTime.setMinutes(
        newEndTime.getMinutes() + SOFT_CLOSE_EXTEND_BY_MINUTES,
      );
      return {
        ...data,
        endTime: newEndTime,
        lastExtendedAt: now,
        extendCount: extendCount + 1,
      };
    }

    return data;
  }

  /** 경매 물품 등록(판매자 전용) */
  async createAuction(dto: CreateAuctionDto, userId: string) {
    if (!AUCTION_BRANDS.includes(dto.brand)) {
      throw new BadRequestException('허용된 브랜드가 아닙니다.');
    }

    if (!AUCTION_SIZES.includes(dto.size)) {
      throw new BadRequestException('허용된 사이즈가 아닙니다.');
    }

    if (dto.buyNowPrice != null && dto.buyNowPrice < dto.startPrice) {
      throw new BadRequestException(
        '즉시 구매 가격은 시작 가격 이상이어야 합니다.',
      );
    }

    const endTime = new Date(dto.endTime);
    if (Number.isNaN(endTime.getTime()) || endTime <= new Date()) {
      throw new BadRequestException(
        '경매 종료 시간은 현재보다 이후여야 합니다.',
      );
    }

    return this.db.transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('등록된 유저가 아닙니다.');
      }

      const sneaker = await tx.sneaker.create({
        data: {
          modelName: dto.modelName,
          brand: dto.brand,
          colorway: dto.color,
          description: dto.description,
          imageUrl: dto.imageUrl,
        },
      });
      const auction = await tx.auction.create({
        data: {
          sneakerId: sneaker.id,
          size: dto.size,
          startPrice: dto.startPrice,
          currentPrice: dto.startPrice,
          buyNowPrice: dto.buyNowPrice ?? null,
          minimumIncrement: dto.minimumIncrement,
          status: 'OPEN',
          endTime,
          winnerUserId: null,
          closedAt: null,
          sellerUserId: user.id,
        },
        include: { sneaker: true },
      });
      return auction;
    });
  }

  /** 실시간 마켓 지표 (LiveStats) */
  async getLiveStats(): Promise<{
    activeBidders: number;
    activeAuctions: number;
    volume24h: number;
    avgBidSpeedSeconds: number;
  }> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [activeBiddersRows, activeAuctions, volume24h, recentBids] =
      await Promise.all([
        this.bidRepo.findDistinctUserIds(now),
        this.auctionRepo.countOpen(now),
        this.auctionRepo.sumClosedVolume24h(dayAgo),
        this.bidRepo.findRecentCreatedAt(100),
      ]);

    const activeBidders = activeBiddersRows.length;

    let avgBidSpeedSeconds = 0.8;
    if (recentBids.length >= 2) {
      const times = recentBids
        .map((b) => new Date(b.createdAt).getTime())
        .reverse();
      const diffs: number[] = [];
      for (let i = 1; i < times.length; i++) {
        diffs.push((times[i] - times[i - 1]) / 1000);
      }
      const sum = diffs.reduce((a, b) => a + b, 0);
      avgBidSpeedSeconds = Math.round((sum / diffs.length) * 10) / 10;
      if (avgBidSpeedSeconds <= 0) avgBidSpeedSeconds = 0.8;
    }

    return {
      activeBidders,
      activeAuctions,
      volume24h,
      avgBidSpeedSeconds,
    };
  }

  /** 메인 물건 리스트 */
  async getMainAuctions(user?: RequestUser): Promise<{
    ongoing: AuctionSummary[];
  }> {
    const now = new Date();
    const rows = await this.auctionRepo.findMainAuctions(now);
    const ongoing = rows.map((row) =>
      this.auctionRepo.rowToAuctionWithDetails(row),
    );

    const wishlistedMap =
      user && ongoing.length > 0
        ? await this.wishlistService.getWishlistedMap(
            user.id,
            ongoing.map((a) => a.id),
          )
        : {};

    return {
      ongoing: ongoing.map((item) =>
        this.toSummary(item, wishlistedMap[item.id] ?? false),
      ),
    };
  }

  /** 내가 등록한 경매 목록 (판매자) */
  async getMySellingAuctions(
    user: RequestUser,
    statusFilter: 'all' | 'ongoing' | 'closed' = 'all',
  ): Promise<AuctionSummary[]> {
    const now = new Date();
    const rows = await this.auctionRepo.findMySelling(
      user.id,
      statusFilter,
      now,
    );
    return rows.map((row) =>
      this.toSummary(this.auctionRepo.rowToAuctionWithDetails(row)),
    );
  }

  /** 내가 입찰한 경매 목록 */
  async getMyBiddingAuctions(
    user: RequestUser,
    status: 'ongoing' | 'closed' | 'all' = 'ongoing',
  ): Promise<AuctionSummary[]> {
    const now = new Date();
    const ids = await this.bidRepo.findAuctionIdsByUserId(user.id);
    if (ids.length === 0) return [];

    const rows = await this.auctionRepo.findByIdsWithSneaker(ids, status, now);
    return rows.map((row) =>
      this.toSummary(this.auctionRepo.rowToAuctionWithDetails(row)),
    );
  }

  /** 경매 리스트 */
  async listAuctions(
    query: AuctionListQueryDto,
    user?: RequestUser,
  ): Promise<{
    items: AuctionSummary[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const { brand, size, sort = 'newest', afterId, limit = 20 } = query;
    const now = new Date();

    const rows = await this.auctionRepo.listWithFilters({
      brand,
      size,
      sort,
      afterId,
      limit,
      now,
    });
    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null;

    const items: AuctionWithDetails[] = sliced.map((row) =>
      this.auctionRepo.rowToAuctionWithDetails(row),
    );

    const auctionIds = items.map((a) => a.id);
    const wishlistedMap = user
      ? await this.wishlistService.getWishlistedMap(user.id, auctionIds)
      : {};

    return {
      items: items.map((item) =>
        this.toSummary(item, wishlistedMap[item.id] ?? false),
      ),
      nextCursor,
      hasMore,
    };
  }

  /** 경매 상세 raw 조회 (sneaker 포함, 내부/외부 서비스용) */
  async getAuctionByIdRaw(
    auctionId: string,
  ): Promise<AuctionWithDetails | null> {
    const row = await this.auctionRepo.findByIdWithSneaker(auctionId);
    if (!row) return null;
    return this.auctionRepo.rowToAuctionWithDetails(row);
  }

  /** 경매 상세 (raw SQL - Supabase relation 'sneaker' 스키마 이슈 회피) */
  async getAuctionById(
    auctionId: string,
    user?: RequestUser,
  ): Promise<AuctionDetail> {
    const auction = await this.getAuctionByIdRaw(auctionId);
    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }
    let isWishlisted = false;
    if (user) {
      const map = await this.wishlistService.getWishlistedMap(user.id, [
        auctionId,
      ]);
      isWishlisted = map[auctionId] ?? false;
    }
    return this.toDetail(auction, isWishlisted);
  }

  /** 입찰 목록 (상세 페이지용) */
  async getBids(auctionId: string, limit = 20): Promise<BidLogItem[]> {
    const rows = await this.bidRepo.findBidsForAuction(auctionId, limit);

    const formatTime = (d: Date) => {
      const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
      if (sec < 60) return '방금 전';
      if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
      if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
      return `${Math.floor(sec / 86400)}일 전`;
    };

    return rows.map((b) => ({
      id: b.id,
      user: b.user_nickname ?? '',
      amount: b.bidPrice,
      time: formatTime(b.createdAt),
      isBot: b.sourceType === 'BOT',
    }));
  }

  /** 입찰 (SELECT FOR UPDATE + soft-close 공통 경로) */
  async placeBid(
    auctionId: string,
    dto: PlaceBidDto,
    user: RequestUser,
  ): Promise<{ bidId: string; currentPrice: number }> {
    const now = new Date();
    const result = await this.db.transaction(async (tx) => {
      const locked = await lockAuctionForUpdate(tx, auctionId, {
        status: 'OPEN',
        endTimeGt: now,
      });

      if (!locked) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
      }
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            where: { disqualifiedAt: null },
            orderBy: { bidPrice: 'desc' },
          },
        },
      });

      if (!auction) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
      }
      if (auction.sellerUserId === user.id) {
        throw new BadRequestException(
          '본인이 등록한 경매에는 입찰할 수 없습니다.',
        );
      }
      const leadingBid = (
        auction.bids as { userId: string }[] | undefined
      )?.[0];
      if (leadingBid?.userId === user.id) {
        throw new BadRequestException(
          '이미 최고 입찰자입니다. 다른 사용자의 입찰을 기다려 주세요.',
        );
      }
      if (auction.status !== 'OPEN') {
        throw new BadRequestException('종료된 경매에는 입찰할 수 없습니다.');
      }
      if (new Date(auction.endTime) <= now) {
        throw new BadRequestException('이미 종료된 경매입니다.');
      }

      const minBid = auction.currentPrice + auction.minimumIncrement;
      if (dto.bidPrice < minBid) {
        throw new BadRequestException(
          `최소 입찰가는 ${minBid.toLocaleString()}원입니다.`,
        );
      }

      const bid = await tx.bid.create({
        data: {
          auctionId,
          userId: user.id,
          bidPrice: dto.bidPrice,
          sourceType: 'USER',
        },
      });

      const held = await this.walletService.holdForBid(
        tx,
        user.id,
        dto.bidPrice,
        bid.id,
      );
      if (!held) {
        throw new BadRequestException('잔액이 부족합니다.');
      }

      const auctionForUpdate = {
        endTime: new Date(auction.endTime),
        extendCount: auction.extendCount ?? 0,
      };
      const updateData = this.buildBidUpdateData(
        auctionForUpdate,
        now,
        dto.bidPrice,
      );
      await tx.auction.update({
        where: { id: auctionId },
        data: updateData,
      });

      return { bid };
    });

    this.eventsService.emitNewBid(auctionId, {
      id: result.bid.id,
      user: user.nickname,
      amount: dto.bidPrice,
      time: '방금 전',
      isBot: false,
    });

    return {
      bidId: result.bid.id,
      currentPrice: dto.bidPrice,
    };
  }

  /** 봇 입찰 */
  async placeBidAsBot(
    auctionId: string,
    bidPrice: number,
    botUser: { id: string; nickname: string },
    strategyType: string,
  ): Promise<{ bidId: string; currentPrice: number } | null> {
    const now = new Date();

    const result = await this.db.transaction(async (tx) => {
      const locked = await lockAuctionForUpdate(tx, auctionId, {
        status: 'OPEN',
        endTimeGt: now,
      });
      if (!locked) return null;

      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          bids: {
            where: { disqualifiedAt: null },
            orderBy: { bidPrice: 'desc' },
          },
        },
      });
      if (!auction || auction.status !== 'OPEN') return null;
      if (new Date(auction.endTime) <= now) return null;
      if (auction.sellerUserId === botUser.id) return null;
      const leadingBid = (
        auction.bids as { userId: string }[] | undefined
      )?.[0];
      if (leadingBid?.userId === botUser.id) return null;

      const minBid = auction.currentPrice + auction.minimumIncrement;
      if (bidPrice < minBid) return null;

      const bid = await tx.bid.create({
        data: {
          auctionId,
          userId: botUser.id,
          bidPrice,
          sourceType: 'BOT',
          strategyType,
        },
      });

      const held = await this.walletService.holdForBid(
        tx,
        botUser.id,
        bidPrice,
        bid.id,
      );
      if (!held) return null;

      const auctionForUpdate = {
        endTime: new Date(auction.endTime),
        extendCount: auction.extendCount ?? 0,
      };
      const updateData = this.buildBidUpdateData(
        auctionForUpdate,
        now,
        bidPrice,
      );
      await tx.auction.update({
        where: { id: auctionId },
        data: updateData,
      });

      return { bid };
    });

    if (!result) return null;

    this.eventsService.emitNewBid(auctionId, {
      id: result.bid.id,
      user: botUser.nickname,
      amount: bidPrice,
      time: '방금 전',
      isBot: true,
    });

    return {
      bidId: result.bid.id,
      currentPrice: bidPrice,
    };
  }

  /** 거래 완료/취소 내역 */
  async getTradeHistory(
    query: AuctionHistoryQueryDto,
  ): Promise<AuctionHistoryResponse> {
    const { limit = 20, period, search } = query;
    const normalizedSearch = search?.trim();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaysClosings =
      await this.auctionRepo.findTodaysClosings(todayStart);
    const tradesToday = todaysClosings.length;
    const todayPrices = todaysClosings.map((item) => item.currentPrice);
    const sumPrice = todayPrices.reduce((sum, price) => sum + price, 0);
    const averagePriceToday = tradesToday
      ? Math.round(sumPrice / tradesToday)
      : null;
    const maxPriceToday = tradesToday > 0 ? Math.max(...todayPrices) : null;

    const periodStart = this.getHistoryPeriodStart(period);

    const historyRows = await this.auctionRepo.findTradeHistory({
      periodStart: periodStart ?? undefined,
      search: normalizedSearch ?? undefined,
      limit,
    });

    const bidCounts = await Promise.all(
      historyRows.map((r) =>
        this.bidRepo
          .countByAuctionId(r.id)
          .then((count) => [{ count: String(count) }]),
      ),
    );

    const formatDate = (value?: Date | null) => {
      if (!value) return '';
      const date = new Date(value);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const items: AuctionHistoryItem[] = historyRows.map((auction, i) => ({
      auctionId: auction.id,
      imageUrl: auction.imageUrl,
      brand: auction.brand,
      modelName: auction.modelName,
      participants: parseInt(bidCounts[i][0]?.count ?? '0', 10),
      finalPrice: auction.currentPrice,
      date: formatDate(auction.closedAt ?? auction.updatedAt),
      status: auction.winnerUserId ? 'completed' : 'cancelled',
    }));

    return {
      stats: {
        tradesToday,
        averagePriceToday,
        maxPriceToday,
      },
      items,
    };
  }

  /** 단건 거래 내역 (SSE newDeal 발송용) */
  async getTradeHistoryItem(
    auctionId: string,
  ): Promise<AuctionHistoryItem | null> {
    const auction = await this.auctionRepo.findTradeHistoryItem(auctionId);
    if (!auction) return null;

    const bidCount = await this.bidRepo.countByAuctionId(auctionId);
    const formatDate = (value?: Date | null) => {
      if (!value) return '';
      const date = new Date(value);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    return {
      auctionId: auction.id,
      imageUrl: auction.imageUrl,
      brand: auction.brand,
      modelName: auction.modelName,
      participants: bidCount,
      finalPrice: auction.currentPrice,
      date: formatDate(auction.closedAt ?? auction.updatedAt),
      status: auction.winnerUserId ? 'completed' : 'cancelled',
    };
  }

  /** 물건 수정 */
  async patchAuctions(
    auctionId: string,
    updateDto: UpdateAuctionDto,
    user: RequestUser,
  ): Promise<AuctionSummary> {
    const auction = await this.getAuctionByIdRaw(auctionId);
    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    if (auction.sellerUserId !== user.id) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    const now = new Date();
    if (auction.status !== 'OPEN') {
      throw new BadRequestException('진행 중인 경매만 수정할 수 있습니다.');
    }
    if (new Date(auction.endTime) <= now) {
      throw new BadRequestException('이미 종료된 경매는 수정할 수 없습니다.');
    }

    const bidCount = await this.bidRepo.countByAuctionId(auctionId);
    const hasBids = bidCount > 0;

    const sneakerUpdates: Record<string, unknown> = {};
    const auctionUpdates: Record<string, unknown> = {};

    if (updateDto.name) sneakerUpdates.modelName = updateDto.name;
    if (updateDto.brand) {
      if (!AUCTION_BRANDS.includes(updateDto.brand)) {
        throw new BadRequestException('허용된 브랜드가 아닙니다.');
      }
      sneakerUpdates.brand = updateDto.brand;
    }
    if (updateDto.size) {
      if (!AUCTION_SIZES.includes(updateDto.size)) {
        throw new BadRequestException('허용된 사이즈가 아닙니다.');
      }
      auctionUpdates.size = updateDto.size;
    }
    if (updateDto.color) sneakerUpdates.colorway = updateDto.color;
    if (updateDto.description)
      sneakerUpdates.description = updateDto.description;
    if (updateDto.imageUrl) sneakerUpdates.imageUrl = updateDto.imageUrl;
    if (typeof updateDto.startPrice === 'number') {
      if (hasBids) {
        throw new BadRequestException(
          '입찰이 있는 경매는 시작 가격을 변경할 수 없습니다.',
        );
      }
      auctionUpdates.startPrice = updateDto.startPrice;
      auctionUpdates.currentPrice = updateDto.startPrice;
    }
    if (typeof updateDto.buyNowPrice === 'number') {
      if (hasBids && updateDto.buyNowPrice < auction.currentPrice) {
        throw new BadRequestException(
          `즉시 구매 가격은 현재 최고 입찰가(${auction.currentPrice.toLocaleString()}원) 이상이어야 합니다.`,
        );
      }
      auctionUpdates.buyNowPrice = updateDto.buyNowPrice;
    }
    if (typeof updateDto.minimumIncrement === 'number') {
      if (updateDto.minimumIncrement <= 0) {
        throw new BadRequestException('최소 단위는 1 이상이어야 합니다.');
      }
      auctionUpdates.minimumIncrement = updateDto.minimumIncrement;
    }
    if (updateDto.endTime) {
      const newEndTime = new Date(updateDto.endTime);
      if (Number.isNaN(newEndTime.getTime()) || newEndTime <= new Date()) {
        throw new BadRequestException('종료 시간은 현재 이후여야 합니다.');
      }
      auctionUpdates.endTime = newEndTime;
    }

    const finalStart: number =
      typeof updateDto.startPrice === 'number'
        ? updateDto.startPrice
        : auction.startPrice;
    const finalBuyNow: number | null =
      typeof updateDto.buyNowPrice === 'number'
        ? updateDto.buyNowPrice
        : auction.buyNowPrice;

    if (typeof finalBuyNow === 'number' && finalStart > finalBuyNow) {
      throw new BadRequestException(
        '즉시 구매 가격은 시작 가격 이상이어야 합니다.',
      );
    }

    return this.db.transaction(async (tx) => {
      const locked = await lockAuctionForUpdate(tx, auctionId, {
        status: 'OPEN',
        endTimeGt: now,
      });
      if (!locked) {
        throw new BadRequestException(
          '경매가 종료되었거나 수정할 수 없는 상태입니다.',
        );
      }

      if (Object.keys(sneakerUpdates).length) {
        await tx.sneaker.update({
          where: { id: auction.sneakerId },
          data: sneakerUpdates,
        });
      }

      const updated = await tx.auction.update({
        where: { id: auction.id },
        data: auctionUpdates,
      });

      const count = await this.bidRepo.countByAuctionId(auction.id);
      const sneakerData =
        Object.keys(sneakerUpdates).length > 0
          ? { ...auction.sneaker, ...sneakerUpdates }
          : auction.sneaker;
      const withCount: AuctionWithDetails = {
        ...updated,
        sneaker: sneakerData,
        _count: { bids: count },
      };
      return this.toSummary(withCount);
    });
  }

  /** 물건 삭제 */
  async deleteAuction(auctionId: string, user: RequestUser) {
    const supabase = this.db.getSupabase();
    const { data: auction } = await supabase
      .from('Auction')
      .select('id, sellerUserId, sneakerId')
      .eq('id', auctionId)
      .single();

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    if (user.role !== UserRole.ADMIN && auction.sellerUserId !== user.id) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    const bidCount = await this.bidRepo.countByAuctionId(auctionId);
    if (bidCount > 0) {
      throw new BadRequestException(
        '입찰이 있는 경매는 삭제할 수 없습니다. 입찰을 취소한 후 다시 시도해 주세요.',
      );
    }

    const orderRows = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM "Order" WHERE "auctionId" = $1 AND status IN ('PENDING', 'PAID', 'FAILED')`,
      [auctionId],
    );
    const activeOrderCount = parseInt(orderRows[0]?.count ?? '0', 10);
    if (activeOrderCount > 0) {
      throw new BadRequestException(
        '결제 대기 중이거나 완료된 주문이 있는 경매는 삭제할 수 없습니다.',
      );
    }

    await supabase.from('Order').delete().eq('auctionId', auctionId);
    await supabase.from('Auction').delete().eq('id', auctionId);

    if (auction.sneakerId) {
      await supabase.from('Sneaker').delete().eq('id', auction.sneakerId);
    }
  }

  /** 거래 내역 기간 시작 날짜 반환 */
  private getHistoryPeriodStart(period?: AuctionHistoryPeriod): Date | null {
    if (!period || period === 'all') return null;
    const now = new Date();
    switch (period) {
      case '1m':
        now.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        now.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        now.setMonth(now.getMonth() - 6);
        break;
      default:
        return null;
    }
    return now;
  }

  /** 경매 상세 타입 변환 */
  private toDetail(
    auction: AuctionWithDetails,
    isWishlisted = false,
  ): AuctionDetail {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const msUntilEnd = endTime.getTime() - now.getTime();
    const ENDING_SOON_MS = 15 * 60 * 1000;

    let status: AuctionDetail['status'] = 'closed';
    if (auction.status === 'OPEN') {
      status =
        msUntilEnd <= 0
          ? 'closed'
          : msUntilEnd <= ENDING_SOON_MS
            ? 'ending_soon'
            : 'ongoing';
    } else if (auction.status === 'CLOSED') {
      status = auction.winnerUserId ? 'closed' : 'failed';
    }

    const sizeNum = parseInt(auction.size, 10);
    const size = Number.isNaN(sizeNum) ? undefined : sizeNum;

    const startPrice = auction.startPrice;
    const currentPrice = auction.currentPrice;
    const priceIncreasePercent =
      startPrice === 0
        ? '0'
        : (((currentPrice - startPrice) / startPrice) * 100).toFixed(1);

    const sneaker = auction.sneaker;

    return {
      id: auction.id,
      modelName: sneaker.modelName,
      brand: sneaker.brand,
      colorway: sneaker.colorway ?? undefined,
      size,
      styleCode: sneaker.styleCode ?? undefined,
      releaseYear: sneaker.releaseYear ?? undefined,
      condition: sneaker.condition ?? undefined,
      origin: sneaker.origin ?? undefined,
      boxIncluded: sneaker.boxIncluded ?? undefined,
      description: sneaker.description ?? undefined,
      imageUrl: sneaker.imageUrl,
      startPrice,
      currentBid: currentPrice,
      buyNowPrice: auction.buyNowPrice,
      endTime:
        auction.endTime instanceof Date
          ? auction.endTime.toISOString()
          : String(auction.endTime),
      participants: auction._count?.bids ?? 0,
      status,
      isWishlisted,
      priceIncreasePercent,
      minimumIncrement: auction.minimumIncrement,
    };
  }

  /** 경매 리스트 타입 변환 */
  private toSummary(
    auction: AuctionWithDetails,
    isWishlisted?: boolean,
  ): AuctionSummary {
    const now = new Date();
    const sneaker = auction.sneaker as {
      modelName: string;
      brand: string;
      imageUrl: string;
    };
    const effectiveStatus: 'OPEN' | 'CLOSED' =
      auction.status === 'OPEN' && new Date(auction.endTime) <= now
        ? 'CLOSED'
        : (auction.status as 'OPEN' | 'CLOSED');
    return {
      auctionId: auction.id,
      sneakerName: sneaker.modelName,
      brand: sneaker.brand,
      imageUrl: sneaker.imageUrl,
      size: auction.size,
      currentPrice: auction.currentPrice,
      endTime:
        auction.endTime instanceof Date
          ? auction.endTime
          : new Date(auction.endTime),
      status: effectiveStatus,
      bidCount: auction._count?.bids ?? undefined,
      buyNowPrice: auction.buyNowPrice,
      winnerUserId: auction.winnerUserId ?? undefined,
      closedAt: auction.closedAt ?? undefined,
      minimumIncrement: auction.minimumIncrement,
      isWishlisted,
    };
  }
}
