import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@/database/database.service';
import { AuctionRepository } from '@/database/repositories/auction.repository';
import { BidRepository } from '@/database/repositories/bid.repository';
import { OrderRepository } from '@/database/repositories/order.repository';
import { RequestUser } from '@/common/decorator/user.decorator';
import { EventsService } from '@/events/events.service';
import { AuctionsService } from '@/auctions/auctions.service';
import { WalletService } from '@/wallet/wallet.service';
import { lockAuctionForUpdate } from '@/auctions/auction-lock.helper';
import {
  CLOSE_EXPIRED_BATCH_SIZE,
  CLOSE_EXPIRED_TIMEOUT_MS,
  PENDING_ORDER_TIMEOUT_DAYS,
  REOPEN_AUCTION_DURATION_HOURS,
} from '@/common/constants';
import type { ReopenOrderPayload } from './orders.types';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auctionRepo: AuctionRepository,
    private readonly bidRepo: BidRepository,
    private readonly orderRepo: OrderRepository,
    private readonly eventsService: EventsService,
    private readonly auctionsService: AuctionsService,
    private readonly walletService: WalletService,
  ) {}

  /** 매분 경매 종료 체크 → 낙찰자 확정, Order 생성 (배치 크기·타임아웃 제한) */
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async closeExpiredAuctions() {
    const now = new Date();
    const start = Date.now();
    const expired = await this.auctionRepo.findExpiredForClose(
      now,
      CLOSE_EXPIRED_BATCH_SIZE,
    );

    for (const { id: auctionId } of expired) {
      if (Date.now() - start >= CLOSE_EXPIRED_TIMEOUT_MS) break;
      const closed = await this.db.transaction(async (tx) => {
        const locked = await lockAuctionForUpdate(tx, auctionId, {
          status: 'OPEN',
          endTimeLte: now,
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
        if (!auction) return null;

        const bids = auction.bids ?? [];
        const winnerBid = bids[0];
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

        for (const bid of bids) {
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

        return { auctionId, winnerUserId, finalPrice };
      });

      if (closed) {
        this.eventsService.emitAuctionClosed(auctionId, {
          status: 'CLOSED',
          winnerUserId: closed.winnerUserId ?? null,
          finalPrice: closed.finalPrice,
        });
        const historyItem =
          await this.auctionsService.getTradeHistoryItem(auctionId);
        if (historyItem) this.eventsService.emitNewDeal(historyItem);
      }
    }
  }

  /** 매시 정각 PENDING 주문 타임아웃 → 유찰 처리 (3일 초과 시) */
  @Cron('0 * * * *', { timeZone: 'Asia/Seoul' })
  async cancelExpiredPendingOrders() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() - PENDING_ORDER_TIMEOUT_DAYS);

    const expired = await this.orderRepo.findExpiredPending(deadline);

    for (const order of expired) {
      const nowPerOrder = new Date();
      await this.db.transaction(async (tx) => {
        const locked = await lockAuctionForUpdate(tx, order.auctionId);
        if (!locked) return;

        const auction = await tx.auction.findUnique({
          where: { id: order.auctionId },
          include: {
            bids: {
              where: { disqualifiedAt: null },
              orderBy: { bidPrice: 'desc' },
            },
          },
        });
        if (!auction || auction.status !== 'CLOSED') return;

        const orderUpdated = await tx.order.updateMany({
          where: { id: order.id, status: 'PENDING' },
          data: {
            status: 'CANCELLED',
            failureReason: '결제 기한 초과',
          },
        });
        if (orderUpdated.count === 0) return;

        const bids = auction.bids ?? [];
        const winnerBid = bids[0];
        const isAuctionWinner =
          winnerBid?.userId === order.buyerUserId &&
          winnerBid?.bidPrice === order.finalPrice;

        if (isAuctionWinner && winnerBid) {
          await tx.bid.update({
            where: { id: winnerBid.id },
            data: { disqualifiedAt: nowPerOrder },
          });
          await this.walletService.releaseBidHold(
            tx,
            winnerBid.userId,
            winnerBid.bidPrice,
            winnerBid.id,
          );
        }

        const reopenEndTime = new Date(nowPerOrder);
        reopenEndTime.setHours(
          reopenEndTime.getHours() + REOPEN_AUCTION_DURATION_HOURS,
        );

        const baselinePrice =
          isAuctionWinner && winnerBid
            ? (bids[1]?.bidPrice ?? auction.startPrice)
            : (bids[0]?.bidPrice ?? auction.startPrice);

        await tx.auction.update({
          where: { id: order.auctionId },
          data: {
            status: 'OPEN',
            winnerUserId: null,
            closedAt: null,
            endTime: reopenEndTime,
            currentPrice: baselinePrice,
          },
        });
      });
    }
  }

  /** 즉시 구매 */
  async buyNow(auctionId: string, user: RequestUser) {
    const now = new Date();

    const auction = await this.auctionsService.getAuctionByIdRaw(auctionId);
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

    const buyer = await this.db.findUserById(user.id);
    if (!buyer || buyer.balance < auction.buyNowPrice) {
      throw new BadRequestException('잔액이 부족합니다.');
    }

    const order = await this.db.transaction(async (tx) => {
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

    this.eventsService.emitAuctionClosed(auctionId, {
      status: 'buy_now',
      winnerUserId: user.id,
      finalPrice: auction.buyNowPrice,
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
    const order = await this.orderRepo.findForPay(orderId);
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

    const winningBid = await this.bidRepo.findWinningBid(order.auctionId);
    const isAuctionWinner =
      winningBid?.userId === user.id &&
      winningBid?.bidPrice === order.finalPrice;
    try {
      const updated = await this.db.transaction(async (tx) => {
        const claimed = await tx.order.updateMany({
          where: { id: orderId, status: 'PENDING' },
          data: { status: 'PAID', paidAt: new Date() },
        });
        if (claimed.count === 0) {
          throw new ConflictException(
            '이미 결제되었거나 결제가 취소되었습니다.',
          );
        }

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
          order.sellerUserId,
          order.finalPrice,
          orderId,
        );

        return tx.order.findUniqueOrThrow({ where: { id: orderId } });
      });

      const u = updated;
      return {
        orderId: u.id,
        status: u.status,
        paidAt: u.paidAt,
      };
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      const paymentError = err;
      try {
        await this.reopenAuctionForFailedPayment({
          id: order.id,
          auctionId: order.auctionId,
          buyerUserId: order.buyerUserId,
          finalPrice: order.finalPrice,
        });
      } catch (reopenErr: unknown) {
        this.logger.error('reopenAuctionForFailedPayment failed', {
          orderId: order.id,
          auctionId: order.auctionId,
          err: reopenErr,
        });
      }
      throw paymentError;
    }
  }

  /** 결제 실패 시 경매 재오픈 (주문 취소, BID_HOLD 해제, 경매 재개) */
  private async reopenAuctionForFailedPayment(order: ReopenOrderPayload) {
    await this.db.transaction(async (tx) => {
      const nowPerOrder = new Date();
      const locked = await lockAuctionForUpdate(tx, order.auctionId);
      if (!locked) return;

      const auction = await tx.auction.findUnique({
        where: { id: order.auctionId },
        include: {
          bids: {
            where: { disqualifiedAt: null },
            orderBy: { bidPrice: 'desc' },
          },
        },
      });
      if (!auction || auction.status !== 'CLOSED') return;

      const orderUpdated = await tx.order.updateMany({
        where: { id: order.id, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          failureReason: '결제 실패',
        },
      });
      if (orderUpdated.count === 0) return;

      const bids = auction.bids ?? [];
      const winnerBid = bids[0];
      const isAuctionWinner =
        winnerBid?.userId === order.buyerUserId &&
        winnerBid?.bidPrice === order.finalPrice;

      if (isAuctionWinner && winnerBid) {
        await tx.bid.update({
          where: { id: winnerBid.id },
          data: { disqualifiedAt: nowPerOrder },
        });
        await this.walletService.releaseBidHold(
          tx,
          winnerBid.userId,
          winnerBid.bidPrice,
          winnerBid.id,
        );
      }

      const reopenEndTime = new Date(nowPerOrder);
      reopenEndTime.setHours(
        reopenEndTime.getHours() + REOPEN_AUCTION_DURATION_HOURS,
      );

      const baselinePrice =
        isAuctionWinner && winnerBid
          ? (bids[1]?.bidPrice ?? auction.startPrice)
          : (bids[0]?.bidPrice ?? auction.startPrice);

      await tx.auction.update({
        where: { id: order.auctionId },
        data: {
          status: 'OPEN',
          winnerUserId: null,
          closedAt: null,
          endTime: reopenEndTime,
          currentPrice: baselinePrice,
        },
      });
    });
  }

  /** 내 주문 목록 */
  async getMyOrders(user: RequestUser) {
    const rows = await this.orderRepo.findMyOrders(user.id);

    return rows.map((o) => ({
      id: o.id,
      auctionId: o.auctionId,
      sneakerName: o.sneaker_modelName,
      imageUrl: o.sneaker_imageUrl,
      brand: o.sneaker_brand,
      finalPrice: o.finalPrice,
      status: o.status,
      createdAt: o.createdAt,
      paidAt: o.paidAt,
    }));
  }
}
