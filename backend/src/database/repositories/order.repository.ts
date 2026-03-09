import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface ExpiredOrderRow {
  id: string;
  auctionId: string;
  buyerUserId: string;
  finalPrice: number;
}

export interface OrderPayRow {
  id: string;
  auctionId: string;
  buyerUserId: string;
  finalPrice: number;
  status: string;
  sellerUserId: string;
}

export interface MyOrderRow {
  id: string;
  auctionId: string;
  finalPrice: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  sneaker_modelName: string;
  sneaker_imageUrl: string;
  sneaker_brand: string;
}

@Injectable()
export class OrderRepository {
  constructor(private readonly db: DatabaseService) {}

  /** 만료된 PENDING 주문 (타임아웃 취소용) */
  async findExpiredPending(deadline: Date): Promise<ExpiredOrderRow[]> {
    return this.db.query<ExpiredOrderRow>(
      `SELECT o.id, o."auctionId", o."buyerUserId", o."finalPrice" FROM "Order" o
       WHERE o.status = 'PENDING' AND o."createdAt" < $1`,
      [deadline],
    );
  }

  /** 결제용 주문 조회 (sellerUserId 포함) */
  async findForPay(orderId: string): Promise<OrderPayRow | null> {
    const rows = await this.db.query<OrderPayRow>(
      `SELECT o.id, o."auctionId", o."buyerUserId", o."finalPrice", o.status, a."sellerUserId"
       FROM "Order" o JOIN "Auction" a ON o."auctionId" = a.id
       WHERE o.id = $1`,
      [orderId],
    );
    return rows[0] ?? null;
  }

  /** 내 주문 목록 */
  async findMyOrders(userId: string): Promise<MyOrderRow[]> {
    return this.db.query<MyOrderRow>(
      `SELECT o.id, o."auctionId", o."finalPrice", o.status, o."createdAt", o."paidAt",
       s."modelName" as sneaker_modelName, s."imageUrl" as sneaker_imageUrl, s.brand as sneaker_brand
       FROM "Order" o JOIN "Auction" a ON o."auctionId" = a.id JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE o."buyerUserId" = $1 ORDER BY o."createdAt" DESC`,
      [userId],
    );
  }
}
