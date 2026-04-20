import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database.service';

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  metadata: unknown | null;
  createdAt: Date;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly db: DatabaseService) {}

  async insert(row: {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string | null;
    metadata: unknown | null;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO "Notification" (id, "userId", type, title, body, metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, CURRENT_TIMESTAMP)`,
      [
        row.id,
        row.userId,
        row.type,
        row.title,
        row.body,
        row.metadata === null || row.metadata === undefined
          ? null
          : JSON.stringify(row.metadata),
      ],
    );
  }

  async listForUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<NotificationRow[]> {
    if (cursor) {
      return this.db.query<NotificationRow>(
        `SELECT n.id, n."userId", n.type, n.title, n.body, n."readAt", n.metadata, n."createdAt"
         FROM "Notification" n
         WHERE n."userId" = $1
           AND EXISTS (SELECT 1 FROM "Notification" c WHERE c.id = $2 AND c."userId" = $1)
           AND n."createdAt" < (SELECT c."createdAt" FROM "Notification" c WHERE c.id = $2 AND c."userId" = $1)
         ORDER BY n."createdAt" DESC, n.id DESC
         LIMIT $3`,
        [userId, cursor, limit],
      );
    }
    return this.db.query<NotificationRow>(
      `SELECT id, "userId", type, title, body, "readAt", metadata, "createdAt"
       FROM "Notification"
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC, id DESC
       LIMIT $2`,
      [userId, limit],
    );
  }

  async countUnread(userId: string): Promise<number> {
    const rows = await this.db.query<{ c: string }>(
      `SELECT COUNT(*)::text as c FROM "Notification" WHERE "userId" = $1 AND "readAt" IS NULL`,
      [userId],
    );
    return parseInt(rows[0]?.c ?? '0', 10);
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const r = await this.db.query<{ id: string }>(
      `UPDATE "Notification" SET "readAt" = CURRENT_TIMESTAMP
       WHERE id = $1 AND "userId" = $2 AND "readAt" IS NULL
       RETURNING id`,
      [id, userId],
    );
    return r.length > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const r = await this.db.query<{ id: string }>(
      `UPDATE "Notification" SET "readAt" = CURRENT_TIMESTAMP
       WHERE "userId" = $1 AND "readAt" IS NULL
       RETURNING id`,
      [userId],
    );
    return r.length;
  }

  /** 동일 타입·경매에 대해 최근 알림이 있는지 (스팸 방지) */
  async existsRecentForAuctionType(
    userId: string,
    type: string,
    auctionId: string,
    withinMinutes: number,
  ): Promise<boolean> {
    const rows = await this.db.query<{ one: number }>(
      `SELECT 1 AS one FROM "Notification"
       WHERE "userId" = $1 AND type = $2
         AND metadata->>'auctionId' = $3
         AND "createdAt" > NOW() - ($4::int * INTERVAL '1 minute')
       LIMIT 1`,
      [userId, type, auctionId, withinMinutes],
    );
    return rows.length > 0;
  }
}
