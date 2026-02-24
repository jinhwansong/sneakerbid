import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestUser } from '@/common/decorator/user.decorator';
import { EventsService } from '@/events/events.service';
import { AuctionsService } from '@/auctions/auctions.service';
import { WalletService } from '@/wallet/wallet.service';
import { lockAuctionForUpdate } from '@/auctions/auction-lock.helper';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auctionsService: AuctionsService,
    private readonly walletService: WalletService,
  ) {}

  /** 매분 경매 종료 체크 → 낙찰자 확정, Order 생성 */
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async closeExpiredAuctions() {
    const now = new Date();
    const expired = await this.prisma.auction.findMany({
      where: {
        status: 'OPEN',
        endTime: { lte: now },
      },
      select: { id: true },
    });

    for (const { id: auctionId } of expired) {
      const closed = await this.prisma.$transaction(async (tx) => {
        const locked = await lockAuctionForUpdate(tx, auctionId, {
          status: 'OPEN',
          endTimeLte: now,
        });
        if (!locked) return null;

        const auction = await tx.auction.findUnique({
          where: { id: auctionId },
          include: {
            bids: { orderBy: { bidPrice: 'desc' } },
          },
        });
        if (!auction) return null;

        const winnerBid = auction.bids[0];
        const winnerUserId = winnerBid?.userId ?? null;
        const finalPrice = winnerBid?.bidPrice ?? auction.currentPrice;

        await tx.auction.update({
          where: { id: auctionId },
          data: {
            status: 'CLOSED',
            closedAt: now,
            winnerUserId,
            currentPrice: finalPrice,
          },
        });

        for (const bid of auction.bids) {
          if (bid.userId !== winnerUserId) {
            await this.walletService.releaseBidHold(
              tx,
              bid.userId,
              bid.bidPrice,
              bid.id,
            );
          }
        }

        if (winnerUserId) {
          await tx.order.create({
            data: {
              auctionId,
              buyerUserId: winnerUserId,
              finalPrice,
              status: 'PENDING',
            },
          });
        }

        return { auctionId };
      });

      if (closed) {
        const historyItem =
          await this.auctionsService.getTradeHistoryItem(auctionId);
        if (historyItem) this.eventsService.emitNewDeal(historyItem);
      }
    }
  }

  /** 즉시 구매 */
  async buyNow(auctionId: string, user: RequestUser) {
    const now = new Date();

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { sneaker: true },
    });

    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }
    if (auction.status !== 'OPEN') {
      throw new BadRequestException('종료된 경매입니다.');
    }
    if (new Date(auction.endTime) <= now) {
      throw new BadRequestException('이미 종료된 경매입니다.');
    }
    if (!auction.buyNowPrice) {
      throw new BadRequestException('즉시 구매 가능한 경매가 아닙니다.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const locked = await lockAuctionForUpdate(tx, auctionId, {
        status: 'OPEN',
        endTimeGt: now,
      });

      if (!locked) {
        throw new BadRequestException(
          '경매가 이미 종료되었거나 다른 사용자가 구매했습니다.',
        );
      }

      await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: 'CLOSED',
          closedAt: now,
          winnerUserId: user.id,
          currentPrice: auction.buyNowPrice,
        },
      });

      return tx.order.create({
        data: {
          auctionId,
          buyerUserId: user.id,
          finalPrice: auction.buyNowPrice,
          status: 'PENDING',
        },
      });
    });

    const historyItem =
      await this.auctionsService.getTradeHistoryItem(auctionId);
    if (historyItem) this.eventsService.emitNewDeal(historyItem);

    return {
      orderId: order.id,
      finalPrice: order.finalPrice,
      status: order.status,
    };
  }

  /** 결제 (시뮬레이션) */
  async payOrder(orderId: string, user: RequestUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        auction: {
          include: {
            bids: {
              orderBy: { bidPrice: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }
    if (order.buyerUserId !== user.id) {
      throw new ForbiddenException('본인 주문만 결제할 수 있습니다.');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(
        `결제 가능한 상태가 아닙니다. (현재: ${order.status})`,
      );
    }

    const winningBid = order.auction.bids[0];
    const isAuctionWinner =
      winningBid?.userId === user.id &&
      winningBid?.bidPrice === order.finalPrice;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (isAuctionWinner) {
        await this.walletService.convertHoldToPayment(
          tx,
          user.id,
          order.finalPrice,
          orderId,
        );
      } else {
        const paid = await this.walletService.pay(
          tx,
          user.id,
          order.finalPrice,
          orderId,
        );
        if (!paid) {
          throw new BadRequestException('잔액이 부족합니다.');
        }
      }

      await this.walletService.settleSeller(
        tx,
        order.auction.sellerUserId,
        order.finalPrice,
        orderId,
      );

      return tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paidAt: new Date() },
      });
    });

    return {
      orderId: updated.id,
      status: updated.status,
      paidAt: updated.paidAt,
    };
  }

  /** 내 주문 목록 */
  async getMyOrders(user: RequestUser) {
    const orders = await this.prisma.order.findMany({
      where: { buyerUserId: user.id },
      include: {
        auction: { include: { sneaker: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      auctionId: o.auctionId,
      sneakerName: o.auction.sneaker.modelName,
      imageUrl: o.auction.sneaker.imageUrl,
      brand: o.auction.sneaker.brand,
      finalPrice: o.finalPrice,
      status: o.status,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
    }));
  }
}
