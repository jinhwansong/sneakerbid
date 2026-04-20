import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import type { AuctionWithDetails } from '@/common/type/auction.type';

export interface AuctionListRow {
  id: string;
  sneakerId: string;
  size: string;
  startPrice: number;
  currentPrice: number;
  buyNowPrice: number | null;
  minimumIncrement: number;
  status: string;
  endTime: Date;
  winnerUserId: string | null;
  closedAt: Date | null;
  sellerUserId: string;
  sneaker_id: string;
  sneaker_modelName: string;
  sneaker_brand: string;
  sneaker_imageUrl: string;
  bid_count: number;
}

export interface AuctionDetailRow extends AuctionListRow {
  sneaker_colorway: string | null;
  sneaker_description: string | null;
  sneaker_styleCode: string | null;
  sneaker_releaseYear: number | null;
  sneaker_condition: string | null;
  sneaker_origin: string | null;
  sneaker_boxIncluded: boolean | null;
}

export interface TradeHistoryRow {
  id: string;
  currentPrice: number;
  closedAt: Date | null;
  updatedAt: Date;
  winnerUserId: string | null;
  imageUrl: string;
  brand: string;
  modelName: string;
}

/**
 * 목록·JOIN용 Auction 컬럼만 명시 (`a.*` 대신).
 * `postCloseFinalizePayload`(JSONB)·버전/연장 메타 등 목록/상세 응답에 불필요한 컬럼 제외 → DB egress·메모리 절감.
 */
const SQL_AUCTION_LIST_COLS = `
  a.id, a."sneakerId", a.size, a."startPrice", a."currentPrice", a."buyNowPrice",
  a."minimumIncrement", a.status, a."endTime", a."winnerUserId", a."closedAt", a."sellerUserId"
`.trim();

const SQL_AUCTION_LIST_WITH_SNEAKER =
  `${SQL_AUCTION_LIST_COLS}, s.id as "sneaker_id", s."modelName" as "sneaker_modelName", s.brand as "sneaker_brand", s."imageUrl" as "sneaker_imageUrl",
         (SELECT COUNT(*) FROM "Bid" WHERE "auctionId" = a.id)::int as bid_count`.trim();

@Injectable()
export class AuctionRepository {
  constructor(private readonly db: DatabaseService) {}

  async existsById(auctionId: string): Promise<boolean> {
    const rows = await this.db.query<{ one: number }>(
      `SELECT 1 AS one FROM "Auction" WHERE id = $1 LIMIT 1`,
      [auctionId],
    );
    return rows.length > 0;
  }

  /**
   * CLOSED이면서 post-close finalize 페이로드가 남은 경매 (재시도 큐).
   */
  async findClosedWithPendingPostCloseFinalize(
    limit: number,
  ): Promise<Array<{ id: string; postCloseFinalizePayload: unknown }>> {
    return this.db.query<{
      id: string;
      postCloseFinalizePayload: unknown;
    }>(
      `SELECT id, "postCloseFinalizePayload" FROM "Auction"
       WHERE status = 'CLOSED' AND "postCloseFinalizePayload" IS NOT NULL
       ORDER BY "updatedAt" ASC
       LIMIT $1`,
      [limit],
    );
  }

  /** 메인 경매 목록 (진행 중, 20건) */
  async findMainAuctions(now: Date): Promise<AuctionListRow[]> {
    return this.db.query<AuctionListRow>(
      `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.status = 'OPEN' AND a."endTime" > $1 ORDER BY a."endTime" ASC LIMIT 20`,
      [now],
    );
  }

  /** 경매 상세 (sneaker 포함) */
  /** 상세 조회 시 조회수 +1 */
  async incrementViewCount(auctionId: string): Promise<void> {
    await this.db.query(
      `UPDATE "Auction" SET "viewCount" = COALESCE("viewCount", 0) + 1 WHERE id = $1`,
      [auctionId],
    );
  }

  async findByIdWithSneaker(
    auctionId: string,
  ): Promise<AuctionDetailRow | null> {
    const rows = await this.db.query<AuctionDetailRow>(
      `SELECT ${SQL_AUCTION_LIST_COLS}, s.id as "sneaker_id", s."modelName" as "sneaker_modelName", s.brand as "sneaker_brand", s."imageUrl" as "sneaker_imageUrl",
         s.colorway as "sneaker_colorway", s.description as "sneaker_description", s."styleCode" as "sneaker_styleCode",
         s."releaseYear" as "sneaker_releaseYear", s.condition as "sneaker_condition", s.origin as "sneaker_origin", s."boxIncluded" as "sneaker_boxIncluded",
         (SELECT COUNT(*) FROM "Bid" WHERE "auctionId" = a.id)::int as bid_count
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.id = $1`,
      [auctionId],
    );
    return rows[0] ?? null;
  }

  /** 판매자별 경매 목록 */
  async findMySelling(
    sellerUserId: string,
    statusFilter: 'all' | 'ongoing' | 'closed',
    now: Date,
  ): Promise<AuctionListRow[]> {
    let sql = `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a."sellerUserId" = $1`;
    const params: unknown[] = [sellerUserId];
    if (statusFilter === 'ongoing') {
      sql += ' AND a.status = $2 AND a."endTime" > $3';
      params.push('OPEN', now);
    } else if (statusFilter === 'closed') {
      sql += ' AND (a.status = $2 OR (a.status = $3 AND a."endTime" <= $4))';
      params.push('CLOSED', 'OPEN', now);
    }
    sql += ' ORDER BY a."createdAt" DESC';
    return this.db.query<AuctionListRow>(sql, params);
  }

  /** 입찰한 경매 목록 (auctionIds 기준) */
  async findByIdsWithSneaker(
    auctionIds: string[],
    status: 'ongoing' | 'closed' | 'all',
    now: Date,
  ): Promise<AuctionListRow[]> {
    if (auctionIds.length === 0) return [];
    let sql = `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.id = ANY($1::text[])`;
    const params: unknown[] = [auctionIds];
    if (status === 'ongoing') {
      sql += ' AND a.status = $2 AND a."endTime" > $3';
      params.push('OPEN', now);
    } else if (status === 'closed') {
      sql += ' AND (a.status = $2 OR (a.status = $3 AND a."endTime" <= $4))';
      params.push('CLOSED', 'OPEN', now);
    }
    sql +=
      status === 'ongoing'
        ? ' ORDER BY a."endTime" ASC'
        : ' ORDER BY a."closedAt" DESC NULLS LAST, a."updatedAt" DESC';
    return this.db.query<AuctionListRow>(sql, params);
  }

  /** 필터/정렬 경매 목록 (커서 페이지네이션) */
  async listWithFilters(params: {
    brand?: string;
    size?: string;
    sort: string;
    afterId?: string;
    limit: number;
    now: Date;
    search?: string;
  }): Promise<AuctionListRow[]> {
    const { brand, size, sort, afterId, limit, now, search } = params;
    const orderMap: Record<string, string> = {
      ending_soon: 'a."endTime" ASC, a.id ASC',
      popular: 'a."currentPrice" DESC, a.id ASC',
      price_low: 'a."currentPrice" ASC, a.id ASC',
      bid_count: 'bid_count DESC, a.id ASC',
      newest: 'a."createdAt" DESC, a.id ASC',
    };
    const orderClause = orderMap[sort] ?? orderMap.newest;

    let sql = `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.status = $1 AND a."endTime" > $2`;
    const queryParams: unknown[] = ['OPEN', now];
    let pi = 3;
    if (brand) {
      sql += ` AND s.brand = $${pi++}`;
      queryParams.push(brand);
    }
    if (size) {
      sql += ` AND a.size = $${pi++}`;
      queryParams.push(size);
    }
    if (search) {
      const term = `%${search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
      sql += ` AND (
        s.brand ILIKE $${pi} ESCAPE '\\' OR s."modelName" ILIKE $${pi} ESCAPE '\\'
        OR COALESCE(s.colorway, '') ILIKE $${pi} ESCAPE '\\' OR COALESCE(s.description, '') ILIKE $${pi} ESCAPE '\\'
      )`;
      queryParams.push(term);
      pi++;
    }
    if (afterId) {
      if (sort === 'newest') {
        sql += ` AND (a."createdAt", a.id) < (SELECT "createdAt", id FROM "Auction" WHERE id = $${pi})`;
      } else if (sort === 'ending_soon') {
        sql += ` AND (a."endTime", a.id) > (SELECT "endTime", id FROM "Auction" WHERE id = $${pi})`;
      } else if (sort === 'popular') {
        sql += ` AND (a."currentPrice", a.id) < (SELECT "currentPrice", id FROM "Auction" WHERE id = $${pi})`;
      } else if (sort === 'price_low') {
        sql += ` AND (a."currentPrice", a.id) > (SELECT "currentPrice", id FROM "Auction" WHERE id = $${pi})`;
      } else if (sort === 'bid_count') {
        sql += ` AND ((SELECT COUNT(*) FROM "Bid" WHERE "auctionId" = a.id), a.id) < ((SELECT COUNT(*) FROM "Bid" WHERE "auctionId" = $${pi}), $${pi + 1})`;
        queryParams.push(afterId, afterId);
        pi += 2;
      } else {
        sql += ` AND a.id < $${pi}`;
      }
      if (sort !== 'bid_count') {
        queryParams.push(afterId);
        pi++;
      }
    }
    sql += ` ORDER BY ${orderClause} LIMIT $${pi}`;
    queryParams.push(limit + 1);
    return this.db.query<AuctionListRow>(sql, queryParams);
  }

  /** LiveStats: 진행 중 경매 수 */
  async countOpen(now: Date): Promise<number> {
    const result = await this.db.query<{ count: number }>(
      `SELECT COUNT(*)::int as count FROM "Auction" WHERE status = 'OPEN' AND "endTime" > $1`,
      [now],
    );
    return Number(result[0]?.count ?? 0);
  }

  /** LiveStats: 24h 거래량 */
  async sumClosedVolume24h(dayAgo: Date): Promise<number> {
    const rows = await this.db.query<{ sum: string }>(
      `SELECT COALESCE(SUM("currentPrice"), 0)::text as sum FROM "Auction"
       WHERE status = 'CLOSED' AND "closedAt" >= $1 AND "winnerUserId" IS NOT NULL`,
      [dayAgo],
    );
    return parseInt(rows[0]?.sum ?? '0', 10);
  }

  /** 오늘 마감된 경매 (거래 내역 통계용) */
  async findTodaysClosings(
    todayStart: Date,
  ): Promise<{ currentPrice: number }[]> {
    return this.db.query<{ currentPrice: number }>(
      `SELECT "currentPrice" FROM "Auction" WHERE status = 'CLOSED' AND "closedAt" >= $1`,
      [todayStart],
    );
  }

  /** 거래 내역 (기간/검색 필터) */
  async findTradeHistory(params: {
    periodStart?: Date;
    search?: string;
    limit: number;
  }): Promise<TradeHistoryRow[]> {
    const { periodStart, search, limit } = params;
    let sql = `SELECT a.id, a."currentPrice", a."closedAt", a."updatedAt", a."winnerUserId", s."imageUrl", s.brand, s."modelName"
      FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
      WHERE a.status = 'CLOSED' AND a."closedAt" IS NOT NULL`;
    const queryParams: unknown[] = [];
    let pi = 1;
    if (periodStart) {
      sql += ` AND a."closedAt" >= $${pi++}`;
      queryParams.push(periodStart);
    }
    if (search) {
      sql += ` AND (s.brand ILIKE $${pi} OR s."modelName" ILIKE $${pi})`;
      queryParams.push(`%${search}%`);
      pi++;
    }
    sql += ` ORDER BY a."closedAt" DESC LIMIT $${pi}`;
    queryParams.push(limit);
    return this.db.query<TradeHistoryRow>(sql, queryParams);
  }

  /** 단건 거래 내역 (SSE newDeal용) */
  async findTradeHistoryItem(
    auctionId: string,
  ): Promise<TradeHistoryRow | null> {
    const rows = await this.db.query<TradeHistoryRow>(
      `SELECT a.id, a."currentPrice", a."closedAt", a."updatedAt", a."winnerUserId", s."imageUrl", s.brand, s."modelName"
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.id = $1 AND a.status = 'CLOSED'`,
      [auctionId],
    );
    return rows[0] ?? null;
  }

  /** 찜 알림: 곧 마감되는 진행 중 경매 (endTime ∈ (now, until]) */
  async findOpenEndingBefore(until: Date, now: Date): Promise<{ id: string }[]> {
    return this.db.query<{ id: string }>(
      `SELECT id FROM "Auction"
       WHERE status = 'OPEN' AND "endTime" > $1 AND "endTime" <= $2`,
      [now, until],
    );
  }

  /** 만료된 경매 (종료 배치용) */
  async findExpiredForClose(
    now: Date,
    limit: number,
  ): Promise<{ id: string }[]> {
    return this.db.query<{ id: string }>(
      `SELECT id FROM "Auction" WHERE status = 'OPEN' AND "endTime" <= $1 ORDER BY "endTime" ASC LIMIT $2`,
      [now, limit],
    );
  }

  /**
   * 봇 재등록 대상: CLOSED + 낙찰자가 봇 + 아직 재등록 안 됨.
   * closedAt은 [closedAfter, closedBefore] 구간 (넓은 구간으로 누락 방지).
   */
  async findClosedForRelist(params: {
    botUserIds: string[];
    closedAfter: Date;
    closedBefore: Date;
    excludeRelistedIds: string[];
  }): Promise<
    (AuctionListRow & {
      sneaker_brand: string;
      sneaker_modelName: string;
    })[]
  > {
    const { botUserIds, closedAfter, closedBefore, excludeRelistedIds } =
      params;
    const excludeClause =
      excludeRelistedIds.length > 0 ? 'AND a.id != ALL($4::text[])' : '';
    const queryParams: unknown[] =
      excludeRelistedIds.length > 0
        ? [botUserIds, closedAfter, closedBefore, excludeRelistedIds]
        : [botUserIds, closedAfter, closedBefore];
    return this.db.query(
      `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a JOIN "Sneaker" s ON a."sneakerId" = s.id
       WHERE a.status = 'CLOSED' AND a."winnerUserId" = ANY($1::text[])
         AND a."closedAt" >= $2 AND a."closedAt" <= $3 ${excludeClause}`,
      queryParams,
    );
  }

  /** 봇이 판매자인 진행 중 경매 (재판매 건 — 다른 봇 입찰 풀에 포함) */
  async findOpenWithBotSeller(
    now: Date,
    limit: number,
  ): Promise<AuctionListRow[]> {
    return this.db.query<AuctionListRow>(
      `SELECT ${SQL_AUCTION_LIST_WITH_SNEAKER}
       FROM "Auction" a
       JOIN "Sneaker" s ON a."sneakerId" = s.id
       JOIN "User" u ON a."sellerUserId" = u.id
       WHERE a.status = 'OPEN' AND a."endTime" > $1 AND u.role = 'BOT'
       ORDER BY a."endTime" ASC
       LIMIT $2`,
      [now, limit],
    );
  }

  /** row → AuctionWithDetails 변환 */
  rowToAuctionWithDetails(
    row: AuctionDetailRow | AuctionListRow,
  ): AuctionWithDetails {
    return {
      id: row.id,
      sneakerId: row.sneakerId,
      size: row.size,
      startPrice: row.startPrice,
      currentPrice: row.currentPrice,
      buyNowPrice: row.buyNowPrice,
      minimumIncrement: row.minimumIncrement,
      status: row.status,
      endTime: row.endTime,
      winnerUserId: row.winnerUserId,
      closedAt: row.closedAt,
      sellerUserId: row.sellerUserId,
      sneaker: {
        id: row.sneaker_id,
        modelName: row.sneaker_modelName,
        brand: row.sneaker_brand,
        imageUrl: row.sneaker_imageUrl,
        colorway: 'sneaker_colorway' in row ? row.sneaker_colorway : null,
        description:
          'sneaker_description' in row ? row.sneaker_description : null,
        styleCode: 'sneaker_styleCode' in row ? row.sneaker_styleCode : null,
        releaseYear:
          'sneaker_releaseYear' in row ? row.sneaker_releaseYear : null,
        condition: 'sneaker_condition' in row ? row.sneaker_condition : null,
        origin: 'sneaker_origin' in row ? row.sneaker_origin : null,
        boxIncluded:
          'sneaker_boxIncluded' in row ? row.sneaker_boxIncluded : null,
      },
      _count: { bids: row.bid_count ?? 0 },
    } as AuctionWithDetails;
  }
}
