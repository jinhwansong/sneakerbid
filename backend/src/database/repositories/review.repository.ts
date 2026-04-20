import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface ReviewRow {
  id: string;
  orderId: string;
  authorUserId: string;
  targetUserId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

@Injectable()
export class ReviewRepository {
  constructor(private readonly db: DatabaseService) {}

  async insert(row: {
    id: string;
    orderId: string;
    authorUserId: string;
    targetUserId: string;
    rating: number;
    comment: string | null;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO "Review" (id, "orderId", "authorUserId", "targetUserId", rating, comment, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [
        row.id,
        row.orderId,
        row.authorUserId,
        row.targetUserId,
        row.rating,
        row.comment,
      ],
    );
  }

  async findByOrderAndAuthor(
    orderId: string,
    authorUserId: string,
  ): Promise<ReviewRow | null> {
    const rows = await this.db.query<ReviewRow>(
      `SELECT id, "orderId", "authorUserId", "targetUserId", rating, comment, "createdAt"
       FROM "Review" WHERE "orderId" = $1 AND "authorUserId" = $2`,
      [orderId, authorUserId],
    );
    return rows[0] ?? null;
  }

  async listByTargetUserId(
    targetUserId: string,
    limit: number,
  ): Promise<ReviewRow[]> {
    return this.db.query<ReviewRow>(
      `SELECT id, "orderId", "authorUserId", "targetUserId", rating, comment, "createdAt"
       FROM "Review" WHERE "targetUserId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
      [targetUserId, limit],
    );
  }

  async averageRatingForUser(targetUserId: string): Promise<{
    avg: number;
    count: number;
  }> {
    const rows = await this.db.query<{ avg: string; c: string }>(
      `SELECT COALESCE(AVG(rating), 0)::text AS avg, COUNT(*)::text AS c
       FROM "Review" WHERE "targetUserId" = $1`,
      [targetUserId],
    );
    return {
      avg: parseFloat(rows[0]?.avg ?? '0'),
      count: parseInt(rows[0]?.c ?? '0', 10),
    };
  }
}
