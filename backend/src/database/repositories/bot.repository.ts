import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface BotRow {
  id: string;
  userId: string;
  type: string;
}

export interface BotWithUserRow {
  id: string;
  userId: string;
  type: string;
  maxBidMultiplier: number;
  bidUnit: number;
  activityStartHour: number;
  activityEndHour: number;
  favoriteBrands: unknown;
  user_id: string;
  user_nickname: string;
  user_balance: number;
}

@Injectable()
export class BotRepository {
  constructor(private readonly db: DatabaseService) {}

  /** 모든 봇 목록 */
  async findAll(): Promise<BotRow[]> {
    return this.db.query<BotRow>('SELECT id, "userId", type FROM "Bot"');
  }

  /** 봇 userId 목록 */
  async findUserIds(): Promise<string[]> {
    const rows = await this.db.query<{ userId: string }>(
      'SELECT "userId" FROM "Bot"',
    );
    return rows.map((r) => r.userId);
  }

  /** 이미 재등록된 경매 ID 목록 */
  async findRelistedAuctionIds(): Promise<string[]> {
    const rows = await this.db.query<{ relistedFromAuctionId: string }>(
      'SELECT "relistedFromAuctionId" FROM "Auction" WHERE "relistedFromAuctionId" IS NOT NULL',
    );
    return rows
      .map((a) => a.relistedFromAuctionId)
      .filter((id): id is string => id != null);
  }

  /** 봇 + 유저 정보 (입찰 시도용) */
  async findWithUsers(): Promise<BotWithUserRow[]> {
    return this.db.query<BotWithUserRow>(
      `SELECT b.id, b."userId", b.type, b."maxBidMultiplier", b."bidUnit", b."activityStartHour", b."activityEndHour", b."favoriteBrands",
       u.id as user_id, u.nickname as user_nickname, u.balance as user_balance
       FROM "Bot" b JOIN "User" u ON b."userId" = u.id`,
    );
  }

  /** 봇 유저 잔액 증가 (일일 충전) */
  async incrementUserBalance(userId: string, amount: number): Promise<void> {
    await this.db.query(
      'UPDATE "User" SET balance = balance + $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, userId],
    );
  }
}
