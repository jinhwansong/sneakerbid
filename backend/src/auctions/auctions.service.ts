import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
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
} from '@/common/type/auction.type';
import { UpdateAuctionDto } from './dto/update.auction.dto';
import { PlaceBidDto } from './dto/place.bid.dto';
import { RequestUser } from '@/common/decorator/user.decorator';
import { EventsService } from '@/events/events.service';
import { BidLogItem } from '@/common/type/bot.type';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  /** 경매 물품 등록(판매자 전용) */
  async createAuction(dto: CreateAuctionDto, userId: string) {
    if (!AUCTION_BRANDS.includes(dto.brand)) {
      throw new BadRequestException('허용된 브랜드가 아닙니다.');
    }

    if (!AUCTION_SIZES.includes(dto.size)) {
      throw new BadRequestException('허용된 사이즈가 아닙니다.');
    }

    if (dto.buyNowPrice < dto.startPrice) {
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

    return this.prisma.$transaction(async (tx) => {
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
          buyNowPrice: dto.buyNowPrice,
          minimumIncrement: dto.minimumIncrement,
          status: 'OPEN',
          endTime,
          winnerUserId: null,
          closedAt: null,
          sellerUserId: user.id,
        },
        include: { sneaker: true },
      });
      // TODO: When Bid logic is introduced, ensure its SELECT ... FOR UPDATE path
      // reuses these validations/currentPrice assignments.

      return auction;
    });
  }

  /** 메인 물건 리스트 */
  async getMainAuctions(): Promise<{
    ongoing: AuctionSummary[];
    closed: AuctionSummary[];
  }> {
    const now = new Date();
    const [ongoing, closed] = await Promise.all([
      this.prisma.auction.findMany({
        where: { status: 'OPEN', endTime: { gt: now } },
        include: { sneaker: true },
        orderBy: { endTime: 'asc' },
        take: 20,
      }),
      this.prisma.auction.findMany({
        where: { status: 'CLOSED' },
        include: { sneaker: true },
        orderBy: { closedAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      ongoing: ongoing.map((item) => this.toSummary(item)),
      closed: closed.map((item) => this.toSummary(item)),
    };
  }

  /** 경매 리스트  */
  async listAuctions(query: AuctionListQueryDto): Promise<{
    items: AuctionSummary[];
    nextCursor: string | null;
    hasMore: boolean;
  }> {
    const { brand, size, sort = 'newest', afterId, limit = 20 } = query;
    const now = new Date();
    const where: Prisma.AuctionWhereInput = {
      status: 'OPEN',
      endTime: { gt: now },
      ...(brand && { sneaker: { brand } }),
      ...(size && { size }),
    };

    let orderBy: Prisma.AuctionOrderByWithAggregationInput;
    switch (sort) {
      case 'ending_soon':
        orderBy = { endTime: 'asc' };
        break;
      case 'popular':
        orderBy = { currentPrice: 'desc' };
        break;
      case 'price_low':
        orderBy = { currentPrice: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const cursorOptions = afterId
      ? { cursor: { id: afterId }, skip: 1 }
      : undefined;

    const items = await this.prisma.auction.findMany({
      where,
      include: {
        sneaker: true,
        _count: { select: { bids: true } },
      },
      orderBy,
      take: limit + 1,
      ...cursorOptions,
    });
    const hasMore = items.length > limit;
    const sliced = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? sliced[sliced.length - 1].id : null;

    return {
      items: sliced.map((item) => this.toSummary(item)),
      nextCursor,
      hasMore,
    };
  }

  /** 경매 상세 */
  async getAuctionById(auctionId: string): Promise<AuctionDetail> {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        sneaker: true,
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    return this.toDetail(auction);
  }

  /** 입찰 목록 (상세 페이지용) */
  async getBids(auctionId: string, limit = 20): Promise<BidLogItem[]> {
    const bids = await this.prisma.bid.findMany({
      where: { auctionId },
      include: { user: true },
      orderBy: { bidPrice: 'desc' },
      take: limit,
    });

    const formatTime = (d: Date) => {
      const sec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (sec < 60) return '방금 전';
      if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
      if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
      return `${Math.floor(sec / 86400)}일 전`;
    };

    return bids.map((b) => ({
      id: b.id,
      user: b.user.nickname,
      amount: b.bidPrice,
      time: formatTime(b.createdAt),
      isBot: b.sourceType === 'BOT',
    }));
  }

  /** 입찰 */
  async placeBid(
    auctionId: string,
    dto: PlaceBidDto,
    user: RequestUser,
  ): Promise<{ bidId: string; currentPrice: number }> {
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: { sneaker: true },
      });

      if (!auction) {
        throw new NotFoundException('경매를 찾을 수 없습니다.');
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

      await tx.auction.update({
        where: { id: auctionId },
        data: { currentPrice: dto.bidPrice },
      });

      return { bid, auction };
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

  /** 봇 입찰  */
  async placeBidAsBot(
    auctionId: string,
    bidPrice: number,
    botUser: { id: string; nickname: string },
    strategyType: string,
  ): Promise<{ bidId: string; currentPrice: number } | null> {
    const now = new Date();
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: { sneaker: true },
          });

          if (
            !auction ||
            auction.status !== 'OPEN' ||
            new Date(auction.endTime) <= now
          ) {
            return null;
          }

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

          // optimistic guarded update: currentPrice가 변경됐으면 0 rows → 재시도
          const updated = await tx.auction.updateMany({
            where: {
              id: auctionId,
              currentPrice: auction.currentPrice,
            },
            data: { currentPrice: bidPrice },
          });

          if (updated.count === 0) {
            throw new Error('CONCURRENT_UPDATE');
          }

          return { bid, auction };
        });

        if (!result) return null;

        this.eventsService.emitNewBid(auctionId, {
          id: result.bid.id,
          user: botUser.nickname,
          amount: bidPrice,
          time: '방금 전',
          isBot: true,
        });

        return { bidId: result.bid.id, currentPrice: bidPrice };
      } catch (err) {
        if (err instanceof Error && err.message === 'CONCURRENT_UPDATE') {
          if (attempt === MAX_RETRIES - 1) {
            this.logger.warn(
              `[placeBidAsBot] CONCURRENT_UPDATE exhausted retries | auctionId=${auctionId} botUserId=${botUser.id} bidPrice=${bidPrice}`,
            );
            return null;
          }
          continue;
        }
        this.logger.error(
          `[placeBidAsBot] bid failed | auctionId=${auctionId} botUserId=${botUser.id} bidPrice=${bidPrice}`,
          err instanceof Error ? err.stack : String(err),
        );
        return null;
      }
    }
    return null;
  }

  /** 거래 완료/취소 내역 */
  async getTradeHistory(
    query: AuctionHistoryQueryDto,
  ): Promise<AuctionHistoryResponse> {
    const { limit = 20, period, search } = query;
    const normalizedSearch = search?.trim();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todaysClosings = await this.prisma.auction.findMany({
      where: {
        status: 'CLOSED',
        closedAt: { gte: todayStart },
      },
      select: { currentPrice: true },
    });
    const tradesToday = todaysClosings.length;
    const todayPrices = todaysClosings.map((item) => item.currentPrice);
    const sumPrice = todayPrices.reduce((sum, price) => sum + price, 0);
    const averagePriceToday = tradesToday
      ? Math.round(sumPrice / tradesToday)
      : null;
    const maxPriceToday = tradesToday > 0 ? Math.max(...todayPrices) : null;

    const historyWhere = this.buildHistoryWhere(normalizedSearch, period);

    const historyItems = await this.prisma.auction.findMany({
      where: historyWhere,
      include: {
        sneaker: true,
        _count: { select: { bids: true } },
      },
      orderBy: { closedAt: 'desc' },
      take: limit,
    });

    const formatDate = (value?: Date | null) => {
      if (!value) return '';
      const date = new Date(value);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
        date.getDate(),
      ).padStart(2, '0')}`;
    };

    const items: AuctionHistoryItem[] = historyItems.map((auction) => ({
      auctionId: auction.id,
      imageUrl: auction.sneaker.imageUrl,
      brand: auction.sneaker.brand,
      modelName: auction.sneaker.modelName,
      participants: auction._count?.bids ?? 0,
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
    const auction = await this.prisma.auction.findFirst({
      where: { id: auctionId, status: 'CLOSED' },
      include: {
        sneaker: true,
        _count: { select: { bids: true } },
      },
    });
    if (!auction) return null;
    const formatDate = (value?: Date | null) => {
      if (!value) return '';
      const date = new Date(value);
      return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };
    return {
      auctionId: auction.id,
      imageUrl: auction.sneaker.imageUrl,
      brand: auction.sneaker.brand,
      modelName: auction.sneaker.modelName,
      participants: auction._count?.bids ?? 0,
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
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { sneaker: true },
    });

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    if (auction.sellerUserId !== user.id) {
      throw new ForbiddenException('수정 권한이 없습니다.');
    }

    if (auction.status !== 'OPEN') {
      throw new BadRequestException('진행 중인 경매만 수정할 수 있습니다.');
    }
    // TODO: Soft-close/lock logic (SELECT ... FOR UPDATE) should reference this method
    // so all adjustments to currentPrice/status run through the same guarded path.

    const sneakerUpdates: Prisma.SneakerUpdateInput = {};
    const auctionUpdates: Prisma.AuctionUpdateInput = {};

    if (updateDto.name) {
      sneakerUpdates.modelName = updateDto.name;
    }

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

    if (updateDto.color) {
      sneakerUpdates.colorway = updateDto.color;
    }

    if (updateDto.description) {
      sneakerUpdates.description = updateDto.description;
    }

    if (updateDto.imageUrl) {
      sneakerUpdates.imageUrl = updateDto.imageUrl;
    }

    if (typeof updateDto.startPrice === 'number') {
      auctionUpdates.startPrice = updateDto.startPrice;
      auctionUpdates.currentPrice = updateDto.startPrice;
    }

    if (typeof updateDto.buyNowPrice === 'number') {
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

    const finalStart =
      typeof updateDto.startPrice === 'number'
        ? updateDto.startPrice
        : auction.startPrice;
    const finalBuyNow =
      typeof updateDto.buyNowPrice === 'number'
        ? updateDto.buyNowPrice
        : auction.buyNowPrice;

    if (typeof finalBuyNow === 'number' && finalStart > finalBuyNow) {
      throw new BadRequestException(
        '즉시 구매 가격은 시작 가격 이상이어야 합니다.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(sneakerUpdates).length) {
        await tx.sneaker.update({
          where: { id: auction.sneakerId },
          data: sneakerUpdates,
        });
      }

      const updated = await tx.auction.update({
        where: { id: auction.id },
        data: auctionUpdates,
        include: {
          sneaker: true,
          _count: { select: { bids: true } },
        },
      });

      return this.toSummary(updated);
    });
  }

  /** 물건 삭제 */
  async deleteAuction(auctionId: string, user: RequestUser) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    if (user.role !== UserRole.ADMIN && auction.sellerUserId !== user.id) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    await this.prisma.auction.delete({ where: { id: auctionId } });
  }

  /** 거래 내역 필터 조건 생성 */
  private buildHistoryWhere(
    search?: string,
    period?: AuctionHistoryPeriod,
  ): Prisma.AuctionWhereInput {
    const periodStart = this.getHistoryPeriodStart(period);
    const closedAtFilter = periodStart
      ? { not: null, gte: periodStart }
      : { not: null };

    const where: Prisma.AuctionWhereInput = {
      status: 'CLOSED',
      closedAt: closedAtFilter,
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { sneaker: { brand: { contains: search, mode: 'insensitive' } } },
            {
              sneaker: {
                modelName: { contains: search, mode: 'insensitive' },
              },
            },
          ],
        },
      ];
    }

    return where;
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
  private toDetail(auction: AuctionWithDetails): AuctionDetail {
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

    return {
      id: auction.id,
      modelName: auction.sneaker.modelName,
      brand: auction.sneaker.brand,
      colorway: auction.sneaker.colorway ?? undefined,
      size,
      styleCode: auction.sneaker.styleCode ?? undefined,
      releaseYear: auction.sneaker.releaseYear ?? undefined,
      condition: auction.sneaker.condition ?? undefined,
      origin: auction.sneaker.origin ?? undefined,
      boxIncluded: auction.sneaker.boxIncluded ?? undefined,
      description: auction.sneaker.description ?? undefined,
      imageUrl: auction.sneaker.imageUrl,
      startPrice,
      currentBid: currentPrice,
      buyNowPrice: auction.buyNowPrice,
      endTime: auction.endTime.toISOString(),
      participants: auction._count?.bids ?? 0,
      status,
      isWishlisted: false,
      priceIncreasePercent,
    };
  }

  /** 경매 리스트 타입 변환 */
  private toSummary(auction: AuctionWithDetails): AuctionSummary {
    return {
      auctionId: auction.id,
      sneakerName: auction.sneaker.modelName,
      brand: auction.sneaker.brand,
      imageUrl: auction.sneaker.imageUrl,
      size: auction.size,
      currentPrice: auction.currentPrice,
      endTime: auction.endTime,
      status: auction.status,
      bidCount: auction._count?.bids ?? undefined,
      buyNowPrice: auction.buyNowPrice,
    };
  }
}
