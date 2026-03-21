import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface BotRow {
  id: string;
  userId: string;
  type: string;
  enabled?: boolean;
}

export interface BotAdminRow extends BotRow {
  favoriteBrands: string[] | null;
  activityStartHour: number;
  activityEndHour: number;
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

  /** 모든 봇 목록 (enabled 포함, 관리자용). enabled 컬럼 없으면 전부 true로 반환 */
  async findAll(): Promise<BotRow[]> {
    try {
      return this.db.query<BotRow>(
        'SELECT id, "userId", type, COALESCE(enabled, true) as enabled FROM "Bot"',
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '42703') {
        const rows = await this.db.query<BotRow>(
          'SELECT id, "userId", type FROM "Bot"',
        );
        return rows.map((r) => ({ ...r, enabled: true }));
      }
      throw err;
    }
  }

  /** 활성 봇 userId 목록 (입찰/재등록용) */
  async findUserIds(): Promise<string[]> {
    try {
      const rows = await this.db.query<{ userId: string }>(
        'SELECT "userId" FROM "Bot" WHERE COALESCE(enabled, true) = true',
      );
      return rows.map((r) => r.userId);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '42703') {
        const rows = await this.db.query<{ userId: string }>(
          'SELECT "userId" FROM "Bot"',
        );
        return rows.map((r) => r.userId);
      }
      throw err;
    }
  }

  /** 활성 봇 + 유저 정보 (입찰 시도용) */
  async findWithUsers(): Promise<BotWithUserRow[]> {
    try {
      return this.db.query<BotWithUserRow>(
        `SELECT b.id, b."userId", b.type, b."maxBidMultiplier", b."bidUnit", b."activityStartHour", b."activityEndHour", b."favoriteBrands",
         u.id as user_id, u.nickname as user_nickname, u.balance as user_balance
         FROM "Bot" b JOIN "User" u ON b."userId" = u.id
         WHERE COALESCE(b.enabled, true) = true`,
      );
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '42703') {
        return this.db.query<BotWithUserRow>(
          `SELECT b.id, b."userId", b.type, b."maxBidMultiplier", b."bidUnit", b."activityStartHour", b."activityEndHour", b."favoriteBrands",
           u.id as user_id, u.nickname as user_nickname, u.balance as user_balance
           FROM "Bot" b JOIN "User" u ON b."userId" = u.id`,
        );
      }
      throw err;
    }
  }

  /** 관리자용 봇 목록 (favoriteBrands, 활동시간 포함) */
  async findAllForAdmin(): Promise<BotAdminRow[]> {
    try {
      const rows = await this.db.query<
        BotAdminRow & { favoriteBrands: unknown }
      >(
        `SELECT id, "userId", type, COALESCE(enabled, true) as enabled,
         "favoriteBrands", "activityStartHour", "activityEndHour"
         FROM "Bot"`,
      );
      return rows.map((r) => {
        let brands: string[] | null = null;
        if (Array.isArray(r.favoriteBrands)) {
          brands = (r.favoriteBrands as unknown[]).filter(
            (x): x is string => typeof x === 'string',
          );
          if (brands.length === 0) brands = null;
        }
        return { ...r, favoriteBrands: brands };
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '42703') {
        const rows = await this.db.query<BotRow>(
          'SELECT id, "userId", type FROM "Bot"',
        );
        return rows.map((r) => ({
          ...r,
          enabled: true,
          favoriteBrands: null as string[] | null,
          activityStartHour: 0,
          activityEndHour: 23,
        }));
      }
      throw err;
    }
  }

  /** 봇 on/off 토글 (관리자용). enabled 컬럼 없으면 false 반환 */
  async setEnabled(botId: string, enabled: boolean): Promise<boolean> {
    try {
      const result = await this.db.query<{ id: string }>(
        'UPDATE "Bot" SET enabled = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id',
        [enabled, botId],
      );
      return result.length > 0;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === '42703') {
        return false;
      }
      throw err;
    }
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

  /** 봇 유저 잔액 증가 (일일 충전) */
  async incrementUserBalance(userId: string, amount: number): Promise<void> {
    await this.db.query(
      'UPDATE "User" SET balance = balance + $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
      [amount, userId],
    );
  }
}
