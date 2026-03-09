import { Injectable } from '@nestjs/common';
import type { TxClient } from '@/database/transaction-client';
import type { WalletRefType, WalletTxType } from '@/common/database/db.types';

@Injectable()
export class WalletService {
  /** 입찰 시 잔액 보류 (BID_HOLD) */
  async holdForBid(
    tx: TxClient,
    userId: string,
    amount: number,
    bidId: string,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user || (user.balance ?? 0) < amount) return false;

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'BID_HOLD' as WalletTxType,
        refType: 'BID' as WalletRefType,
        refId: bidId,
      },
    });
    return true;
  }

  /** 입찰 보류 해제 (BID_RELEASE) - 비낙찰자 환불 */
  async releaseBidHold(
    tx: TxClient,
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
        type: 'BID_RELEASE' as WalletTxType,
        refType: 'BID' as WalletRefType,
        refId: bidId,
      },
    });
  }

  /** 결제 (PAYMENT) - buyNow 등 BID_HOLD 없이 직접 결제 */
  async pay(
    tx: TxClient,
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    if (!user || (user.balance ?? 0) < amount) return false;

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'PAYMENT' as WalletTxType,
        refType: 'ORDER' as WalletRefType,
        refId: orderId,
      },
    });
    return true;
  }

  /** 정산 (판매자 입금) - ADJUSTMENT */
  async settleSeller(
    tx: TxClient,
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
        type: 'ADJUSTMENT' as WalletTxType,
        refType: 'ORDER' as WalletRefType,
        refId: orderId,
      },
    });
  }

  /** 경매 낙찰자 결제 - BID_HOLD를 PAYMENT로 전환 (잔액 추가 차감 없음) */
  async convertHoldToPayment(
    tx: TxClient,
    userId: string,
    amount: number,
    orderId: string,
  ): Promise<void> {
    await tx.walletTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: 'PAYMENT' as WalletTxType,
        refType: 'ORDER' as WalletRefType,
        refId: orderId,
      },
    });
  }
}
