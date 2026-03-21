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
import type { TxClient } from '@/database/transaction-client';
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

/** 경매 종료 트랜잭션 결과 (패자 입찰은 트랜잭션 내 disqualifiedAt 설정, releaseBidHold는 post-commit) */
type CloseResult = {
  auctionId: string;
  winnerUserId: string | null;
  finalPrice: number;
  losingBids: Array<{ userId: string; bidPrice: number; id: string }>;
};

/** lock 옵션 (closeExpired: endTimeLte, closeAuctionForAdmin: status만) */
type CloseLockOptions = {
  status?: 'OPEN';
  endTimeLte?: Date;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  /** finalizeAuctionClose 실패 시 재시도 (post-commit 단계 전용) */
  private readonly auctionFinalizeRetryQueue: CloseResult[] = [];

  constructor(
    private readonly db: DatabaseService,
    private readonly auctionRepo: AuctionRepository,
    private readonly bidRepo: BidRepository,
    private readonly orderRepo: OrderRepository,
    private readonly eventsService: EventsService,
    private readonly auctionsService: AuctionsService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * 경매 종료 DB 작업만 수행 (트랜잭션 내).
   * releaseBidHold는 호출하지 않음 → finalizeAuctionClose에서 post-commit으로 수행.
   */
  private async executeCloseInTransaction(
    tx: TxClient,
    auctionId: string,
    lockOptions: CloseLockOptions,
    now: Date,
  ): Promise<CloseResult | null> {
    const locked = await lockAuctionForUpdate(tx, auctionId, lockOptions);
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

    const losingBids = bids
      .filter((b) => b.userId !== winnerUserId)
      .map((b) => ({ userId: b.userId, bidPrice: b.bidPrice, id: b.id }));

    for (const l of losingBids) {
      await tx.bid.update({
        where: { id: l.id },
        data: { disqualifiedAt: now },
      });
    }

    return { auctionId, winnerUserId, finalPrice, losingBids };
  }

  /**
   * 경매 종료 후 post-commit 단계: losing bid hold 해제 + 이벤트 발행.
   * closeAuctionForAdmin, closeExpiredAuctions 모두 이 시퀀스를 사용.
   */
  private async finalizeAuctionClose(result: CloseResult): Promise<void> {
    if (result.losingBids.length > 0) {
      await this.db.transaction(async (tx) => {
        for (const bid of result.losingBids) {
          await this.walletService.releaseBidHold(
            tx,
            bid.userId,
            bid.bidPrice,
            bid.id,
          );
        }
      });
    }
    this.eventsService.emitAuctionClosed(result.auctionId, {
      status: 'CLOSED',
      winnerUserId: result.winnerUserId,
      finalPrice: result.finalPrice,
    });
    const historyItem = await this.auctionsService.getTradeHistoryItem(
      result.auctionId,
    );
    if (historyItem) this.eventsService.emitNewDeal(historyItem);
  }

  /** 큐에 쌓인 finalize 재시도 (동일 분에 closeExpired와 함께 처리) */
  private async processAuctionFinalizeRetryQueue(): Promise<void> {
    if (this.auctionFinalizeRetryQueue.length === 0) return;
    const pending = [...this.auctionFinalizeRetryQueue];
    this.auctionFinalizeRetryQueue.length = 0;
    for (const closed of pending) {
      try {
        await this.finalizeAuctionClose(closed);
      } catch (err: unknown) {
        this.auctionFinalizeRetryQueue.push(closed);
        this.logger.error('Auction finalize retry failed (re-queued)', {
          auctionId: closed.auctionId,
          winnerUserId: closed.winnerUserId,
          finalPrice: closed.finalPrice,
          losingBidsCount: closed.losingBids.length,
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  /**
   * 커밋 후 finalize: 실패 시 로그 + 재시도 큐 (경매/Order는 이미 확정됨).
   */
  private async safeFinalizeAuctionClose(closed: CloseResult): Promise<void> {
    try {
      await this.finalizeAuctionClose(closed);
    } catch (err: unknown) {
      this.logger.error(
        'Auction finalize failed after commit (queued for retry)',
        {
          auctionId: closed.auctionId,
          winnerUserId: closed.winnerUserId,
          finalPrice: closed.finalPrice,
          losingBidsCount: closed.losingBids.length,
          err: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
      );
      this.auctionFinalizeRetryQueue.push(closed);
    }
  }

  /** finalize 재시도 전용 (만료 경매 없을 때도 큐 비우기) */
  @Cron('*/5 * * * *', { timeZone: 'Asia/Seoul' })
  async retryFailedAuctionFinalizations() {
    await this.processAuctionFinalizeRetryQueue();
  }

  /** 매분 경매 종료 체크 → 낙찰자 확정, Order 생성 (배치 크기·타임아웃 제한) */
  @Cron('* * * * *', { timeZone: 'Asia/Seoul' })
  async closeExpiredAuctions() {
    await this.processAuctionFinalizeRetryQueue();
    const now = new Date();
    const start = Date.now();
    const expired = await this.auctionRepo.findExpiredForClose(
      now,
      CLOSE_EXPIRED_BATCH_SIZE,
    );

    for (const { id: auctionId } of expired) {
      if (Date.now() - start >= CLOSE_EXPIRED_TIMEOUT_MS) break;
      const closed = await this.db.transaction(async (tx) =>
        this.executeCloseInTransaction(
          tx,
          auctionId,
          {
            status: 'OPEN',
            endTimeLte: now,
          },
          now,
        ),
      );

      if (closed) {
        await this.safeFinalizeAuctionClose(closed);
      }
    }
  }

  /** 관리자용 경매 강제 종료 (endTime 무관) */
  async closeAuctionForAdmin(auctionId: string): Promise<boolean> {
    const now = new Date();
    const closed = await this.db.transaction(async (tx) =>
      this.executeCloseInTransaction(tx, auctionId, { status: 'OPEN' }, now),
    );

    if (closed) {
      await this.safeFinalizeAuctionClose(closed);
    }

    return !!closed;
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

          const auction = await tx.auction.findUnique({
            where: { id: order.auctionId },
            include: {
              bids: {
                where: { disqualifiedAt: null },
                orderBy: { bidPrice: 'desc' },
              },
            },
          });
          const bids = auction?.bids ?? [];
          const nowPerOrder = new Date();
          for (const bid of bids) {
            await tx.bid.update({
              where: { id: bid.id },
              data: { disqualifiedAt: nowPerOrder },
            });
            await this.walletService.releaseBidHold(
              tx,
              bid.userId,
              bid.bidPrice,
              bid.id,
            );
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
