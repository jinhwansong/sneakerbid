import { WalletService } from './wallet.service';
import type { TxClient } from '@/database/transaction-client';

describe('WalletService', () => {
  let service: WalletService;
  let mockTx: TxClient;

  beforeEach(() => {
    service = new WalletService();
    mockTx = createMockTx();
  });

  function createMockTx(overrides?: Partial<TxClient>): TxClient {
    const userFindUnique = jest.fn();
    const userUpdate = jest.fn();
    const walletTransactionCreate = jest.fn();

    return {
      user: {
        findUnique: userFindUnique,
        update: userUpdate,
      },
      walletTransaction: {
        create: walletTransactionCreate,
      },
      ...overrides,
    } as unknown as TxClient;
  }

  describe('holdForBid', () => {
    it('잔액이 충분하면 보류 후 true 반환', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        balance: 100000,
      });

      const result = await service.holdForBid(
        mockTx,
        'u1',
        50000,
        'bid-1',
      );

      expect(result).toBe(true);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { balance: { decrement: 50000 } },
      });
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: -50000,
          type: 'BID_HOLD',
          refType: 'BID',
          refId: 'bid-1',
        },
      });
    });

    it('잔액이 부족하면 false 반환', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        balance: 10000,
      });

      const result = await service.holdForBid(
        mockTx,
        'u1',
        50000,
        'bid-1',
      );

      expect(result).toBe(false);
      expect(mockTx.user.update).not.toHaveBeenCalled();
      expect(mockTx.walletTransaction.create).not.toHaveBeenCalled();
    });

    it('유저가 없으면 false 반환', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.holdForBid(
        mockTx,
        'u1',
        50000,
        'bid-1',
      );

      expect(result).toBe(false);
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });

    it('balance가 null이면 0으로 간주', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        balance: null,
      });

      const result = await service.holdForBid(mockTx, 'u1', 1000, 'bid-1');

      expect(result).toBe(false);
    });
  });

  describe('releaseBidHold', () => {
    it('잔액 증가 및 BID_RELEASE 트랜잭션 생성', async () => {
      await service.releaseBidHold(mockTx, 'u1', 50000, 'bid-1');

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { balance: { increment: 50000 } },
      });
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: 50000,
          type: 'BID_RELEASE',
          refType: 'BID',
          refId: 'bid-1',
        },
      });
    });
  });

  describe('pay', () => {
    it('잔액이 충분하면 결제 후 true 반환', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        balance: 100000,
      });

      const result = await service.pay(mockTx, 'u1', 80000, 'order-1');

      expect(result).toBe(true);
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { balance: { decrement: 80000 } },
      });
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: -80000,
          type: 'PAYMENT',
          refType: 'ORDER',
          refId: 'order-1',
        },
      });
    });

    it('잔액이 부족하면 false 반환', async () => {
      (mockTx.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        balance: 50000,
      });

      const result = await service.pay(mockTx, 'u1', 80000, 'order-1');

      expect(result).toBe(false);
      expect(mockTx.user.update).not.toHaveBeenCalled();
    });
  });

  describe('settleSeller', () => {
    it('판매자 잔액 증가 및 ADJUSTMENT 트랜잭션 생성', async () => {
      await service.settleSeller(mockTx, 'seller-1', 150000, 'order-1');

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: 'seller-1' },
        data: { balance: { increment: 150000 } },
      });
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'seller-1',
          amount: 150000,
          type: 'ADJUSTMENT',
          refType: 'ORDER',
          refId: 'order-1',
        },
      });
    });
  });

  describe('convertHoldToPayment', () => {
    it('PAYMENT 트랜잭션만 생성 (잔액 변경 없음)', async () => {
      await service.convertHoldToPayment(mockTx, 'u1', 100000, 'order-1');

      expect(mockTx.user.update).not.toHaveBeenCalled();
      expect(mockTx.walletTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          amount: -100000,
          type: 'PAYMENT',
          refType: 'ORDER',
          refId: 'order-1',
        },
      });
    });
  });
});
