import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WalletRefType, WalletTxType } from '@prisma/client';

/** user, walletTransaction 모델을 사용하는 트랜잭션 클라이언트 */
type Tx = Pick<PrismaService, 'user' | 'walletTransaction'>;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  /** 입찰 시 잔액 보류 (BID_HOLD) */
  async holdForBid(
    tx: Tx,
    userId: string,
    amount: number,
    bidId: string,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user || user.balance < amount) return false;

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: WalletTxType.BID_HOLD,
        refType: WalletRefType.BID,
        refId: bidId,
      },
    });
    return true;
  }

  /** 입찰 보류 해제 (BID_RELEASE) - 비낙찰자 환불 */
  async releaseBidHold(
    tx: Tx,
    userId: string,
    amount: number,
    bidId: string,
  ): Promise<void> {
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        amount,
        type: WalletTxType.BID_RELEASE,
        refType: WalletRefType.BID,
        refId: bidId,
      },
    });
  }

  /** 결제 (PAYMENT) - buyNow 등 BID_HOLD 없이 직접 결제 */
  async pay(
    tx: Tx,
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user || user.balance < amount) return false;

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: WalletTxType.PAYMENT,
        refType: WalletRefType.ORDER,
        refId: orderId,
      },
    });
    return true;
  }

  /** 정산 (판매자 입금) - ADJUSTMENT */
  async settleSeller(
    tx: Tx,
    sellerUserId: string,
    amount: number,
    orderId: string,
  ): Promise<void> {
    await tx.user.update({
      where: { id: sellerUserId },
      data: { balance: { increment: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId: sellerUserId,
        amount,
        type: WalletTxType.ADJUSTMENT,
        refType: WalletRefType.ORDER,
        refId: orderId,
      },
    });
  }

  /** 경매 낙찰자 결제 - BID_HOLD를 PAYMENT로 전환 (잔액 추가 차감 없음) */
  async convertHoldToPayment(
    tx: Tx,
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<void> {
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: WalletTxType.PAYMENT,
        refType: WalletRefType.ORDER,
        refId: orderId,
      },
    });
  }
}
