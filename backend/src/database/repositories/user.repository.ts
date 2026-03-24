import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) {}

  async findIdByNicknameAndRole(
    nickname: string,
    role: string,
  ): Promise<string | null> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM "User" WHERE nickname = $1 AND role = $2 LIMIT 1`,
      [nickname, role],
    );
    return rows[0]?.id ?? null;
  }

  /** 가장 오래된 일반 사용자 (시드 판매자 폴백) */
  async findOldestUserId(): Promise<string | null> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM "User" WHERE role = 'USER' ORDER BY "createdAt" ASC LIMIT 1`,
    );
    return rows[0]?.id ?? null;
  }

  async insertSeedSeller(id: string): Promise<void> {
    await this.db.query(
      `INSERT INTO "User" (id, nickname, role, balance, "createdAt", "updatedAt")
       VALUES ($1, 'seed_seller', 'USER', 1000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id],
    );
  }
}
