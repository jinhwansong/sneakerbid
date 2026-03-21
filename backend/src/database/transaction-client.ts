import { randomUUID } from 'crypto';
import type { PoolClient } from 'pg';
import type { WalletTxType, WalletRefType } from '@/common/database/db.types';

/** 허용된 컬럼만 포함하여 SQL 인젝션 방지 */
const SNEAKER_UPDATE_WHITELIST = new Set([
  'modelName',
  'brand',
  'colorway',
  'description',
  'imageUrl',
  'popularityScore',
  'styleCode',
  'releaseYear',
  'condition',
  'origin',
  'boxIncluded',
]);
const AUCTION_UPDATE_WHITELIST = new Set([
  'sneakerId',
  'size',
  'startPrice',
  'currentPrice',
  'buyNowPrice',
  'minimumIncrement',
  'status',
  'endTime',
  'winnerUserId',
  'closedAt',
  'version',
  'lastExtendedAt',
  'extendCount',
  'sellerUserId',
  'relistedFromAuctionId',
  'postCloseFinalizePayload',
]);
const BID_UPDATE_WHITELIST = new Set([
  'auctionId',
  'userId',
  'bidPrice',
  'sourceType',
  'strategyType',
  'disqualifiedAt',
]);
const ORDER_UPDATE_WHITELIST = new Set([
  'auctionId',
  'buyerUserId',
  'finalPrice',
  'status',
  'failureReason',
  'paidAt',
]);

function filterUpdateData(
  data: Record<string, unknown>,
  whitelist: Set<string>,
  tableName: string,
): [string, unknown][] {
  const entries: [string, unknown][] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (!whitelist.has(k)) {
      throw new Error(
        `[TxClient] Invalid column "${k}" for ${tableName} update. Allowed: ${[...whitelist].join(', ')}`,
      );
    }
    entries.push([k, v]);
  }
  return entries;
}

/** Transaction client - Prisma-like API for use within transactions */
export interface TxClient {
  user: {
    findUnique: (args: {
      where: { id: string };
      select?: { balance?: boolean };
    }) => Promise<{ id: string; balance?: number } | null>;
    update: (args: {
      where: { id: string };
      data: { balance?: { increment?: number; decrement?: number } };
    }) => Promise<void>;
  };
  sneaker: {
    create: (args: { data: Record<string, unknown> }) => Promise<{
      id: string;
      modelName: string;
      brand: string;
      colorway: string | null;
      description: string | null;
      imageUrl: string;
      popularityScore: number;
      styleCode: string | null;
      releaseYear: number | null;
      condition: string | null;
      origin: string | null;
      boxIncluded: boolean | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<void>;
  };
  auction: {
    findUnique: (args: {
      where: { id: string };
      include?: {
        sneaker?: boolean;
        bids?: { where?: object; orderBy?: object };
      };
    }) => Promise<AuctionRow | null>;
    create: (args: {
      data: Record<string, unknown>;
      include?: { sneaker?: boolean };
    }) => Promise<AuctionWithSneaker>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
      include?: { sneaker?: boolean; _count?: { select: { bids: boolean } } };
    }) => Promise<AuctionRow>;
  };
  bid: {
    create: (args: { data: Record<string, unknown> }) => Promise<BidRow>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<void>;
  };
  order: {
    create: (args: { data: Record<string, unknown> }) => Promise<OrderRow>;
    updateMany: (args: {
      where: { id: string; status?: string };
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
    findUniqueOrThrow: (args: { where: { id: string } }) => Promise<OrderRow>;
  };
  walletTransaction: {
    create: (args: {
      data: {
        userId: string;
        amount: number;
        type: WalletTxType;
        refType: WalletRefType;
        refId: string;
      };
    }) => Promise<void>;
  };
  $queryRaw: <T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ) => Promise<T[]>;
}

export interface AuctionRow {
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
  version: number;
  lastExtendedAt: Date | null;
  extendCount: number;
  sellerUserId: string;
  relistedFromAuctionId: string | null;
  /** Pending post-close finalize (wallet + events); absent or null when none */
  postCloseFinalizePayload?: Record<string, unknown> | null;
  sneaker?: { modelName: string; brand: string; imageUrl: string };
  bids?: BidRow[];
}

export interface AuctionWithSneaker extends AuctionRow {
  sneaker: {
    id: string;
    modelName: string;
    brand: string;
    colorway: string | null;
    imageUrl: string;
  };
}

export interface BidRow {
  id: string;
  auctionId: string;
  userId: string;
  bidPrice: number;
  sourceType: string;
  strategyType: string | null;
  createdAt: Date;
  disqualifiedAt: Date | null;
}

export interface OrderRow {
  id: string;
  auctionId: string;
  buyerUserId: string;
  finalPrice: number;
  status: string;
  failureReason: string | null;
  createdAt: Date;
  paidAt: Date | null;
}

export function createTxClient(client: PoolClient): TxClient {
  const uuid = () => randomUUID();

  return {
    user: {
      async findUnique(args) {
        const sel = args.select?.balance
          ? 'id, balance'
          : 'id, nickname, role, balance, "profileImageUrl", "createdAt", "updatedAt"';
        const r = await client.query(
          `SELECT ${sel} FROM "User" WHERE id = $1`,
          [args.where.id],
        );
        return (r.rows[0] ?? null) as { id: string; balance?: number } | null;
      },
      async update(args) {
        const data = args.data as {
          balance?: { increment?: number; decrement?: number };
        };
        if (data.balance?.increment != null) {
          await client.query(
            'UPDATE "User" SET balance = balance + $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [data.balance.increment, args.where.id],
          );
        } else if (data.balance?.decrement != null) {
          await client.query(
            'UPDATE "User" SET balance = balance - $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [data.balance.decrement, args.where.id],
          );
        }
      },
    },
    sneaker: {
      async create(args) {
        const d = args.data;
        const id = (d.id as string) ?? uuid();
        await client.query(
          `INSERT INTO "Sneaker" (id, "modelName", brand, colorway, description, "imageUrl", "popularityScore", "styleCode", "releaseYear", condition, origin, "boxIncluded", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            id,
            d.modelName ?? '',
            d.brand ?? '',
            d.colorway ?? null,
            d.description ?? null,
            d.imageUrl ?? '',
            d.popularityScore ?? 0,
            d.styleCode ?? null,
            d.releaseYear ?? null,
            d.condition ?? null,
            d.origin ?? null,
            d.boxIncluded ?? null,
          ],
        );
        const r = await client.query('SELECT * FROM "Sneaker" WHERE id = $1', [
          id,
        ]);
        return r.rows[0] as Awaited<ReturnType<TxClient['sneaker']['create']>>;
      },
      async update(args) {
        const d = args.data;
        const entries = filterUpdateData(
          d,
          SNEAKER_UPDATE_WHITELIST,
          'Sneaker',
        );
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        for (const [k, v] of entries) {
          sets.push(`"${k}" = $${i++}`);
          vals.push(v);
        }
        if (sets.length === 0) return;
        sets.push('"updatedAt" = CURRENT_TIMESTAMP');
        vals.push(args.where.id);
        await client.query(
          `UPDATE "Sneaker" SET ${sets.join(', ')} WHERE id = $${i}`,
          vals,
        );
      },
    },
    auction: {
      async findUnique(args) {
        const r = await client.query('SELECT * FROM "Auction" WHERE id = $1', [
          args.where.id,
        ]);
        const row = r.rows[0] as AuctionRow | undefined;
        if (!row) return null;
        if (args.include?.bids) {
          const bidsR = await client.query(
            'SELECT * FROM "Bid" WHERE "auctionId" = $1 AND "disqualifiedAt" IS NULL ORDER BY "bidPrice" DESC',
            [args.where.id],
          );
          row.bids = bidsR.rows as BidRow[];
        }
        if (args.include?.sneaker) {
          const sneakerId = row.sneakerId;
          const snR = await client.query(
            'SELECT * FROM "Sneaker" WHERE id = $1',
            [sneakerId],
          );
          row.sneaker = snR.rows[0] as AuctionRow['sneaker'];
        }
        return row;
      },
      async create(args) {
        const d = args.data;
        const id = (d.id as string) ?? uuid();
        await client.query(
          `INSERT INTO "Auction" (id, "sneakerId", size, "startPrice", "currentPrice", "buyNowPrice", "minimumIncrement", status, "endTime", "winnerUserId", "closedAt", "sellerUserId", "relistedFromAuctionId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            id,
            d.sneakerId,
            d.size,
            d.startPrice,
            d.currentPrice ?? d.startPrice,
            d.buyNowPrice ?? null,
            d.minimumIncrement,
            d.status ?? 'OPEN',
            d.endTime,
            d.winnerUserId ?? null,
            d.closedAt ?? null,
            d.sellerUserId,
            d.relistedFromAuctionId ?? null,
          ],
        );
        const r = await client.query('SELECT * FROM "Auction" WHERE id = $1', [
          id,
        ]);
        const auction = r.rows[0] as AuctionWithSneaker | undefined;
        if (!auction) {
          throw new Error(
            `Auction create failed: no row returned for id=${id}`,
          );
        }
        if (args.include?.sneaker) {
          const snR = await client.query(
            'SELECT * FROM "Sneaker" WHERE id = $1',
            [auction.sneakerId],
          );
          const sneaker = snR.rows[0] as
            | AuctionWithSneaker['sneaker']
            | undefined;
          if (!sneaker) {
            throw new Error(
              `Auction create: Sneaker not found for sneakerId=${auction.sneakerId}`,
            );
          }
          auction.sneaker = sneaker;
        }
        return auction;
      },
      async update(args) {
        const d = args.data;
        const entries = filterUpdateData(
          d,
          AUCTION_UPDATE_WHITELIST,
          'Auction',
        );
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        for (const [k, v] of entries) {
          sets.push(`"${k}" = $${i++}`);
          vals.push(v);
        }
        if (sets.length === 0) {
          const r = await client.query(
            'SELECT * FROM "Auction" WHERE id = $1',
            [args.where.id],
          );
          return r.rows[0] as AuctionRow;
        }
        sets.push('"updatedAt" = CURRENT_TIMESTAMP');
        vals.push(args.where.id);
        const r = await client.query(
          `UPDATE "Auction" SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
          vals,
        );
        return r.rows[0] as AuctionRow;
      },
    },
    bid: {
      async create(args) {
        const d = args.data;
        const id = (d.id as string) ?? uuid();
        await client.query(
          `INSERT INTO "Bid" (id, "auctionId", "userId", "bidPrice", "sourceType", "strategyType", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [
            id,
            d.auctionId,
            d.userId,
            d.bidPrice,
            d.sourceType ?? 'USER',
            d.strategyType ?? null,
          ],
        );
        const r = await client.query('SELECT * FROM "Bid" WHERE id = $1', [id]);
        return r.rows[0] as BidRow;
      },
      async update(args) {
        const d = args.data;
        const entries = filterUpdateData(d, BID_UPDATE_WHITELIST, 'Bid');
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        for (const [k, v] of entries) {
          sets.push(`"${k}" = $${i++}`);
          vals.push(v);
        }
        if (sets.length === 0) return;
        vals.push(args.where.id);
        await client.query(
          `UPDATE "Bid" SET ${sets.join(', ')} WHERE id = $${i}`,
          vals,
        );
      },
    },
    order: {
      async create(args) {
        const d = args.data;
        const id = (d.id as string) ?? uuid();
        await client.query(
          `INSERT INTO "Order" (id, "auctionId", "buyerUserId", "finalPrice", status, "failureReason", "createdAt", "paidAt")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
          [
            id,
            d.auctionId,
            d.buyerUserId,
            d.finalPrice,
            d.status ?? 'PENDING',
            d.failureReason ?? null,
            d.paidAt ?? null,
          ],
        );
        const r = await client.query('SELECT * FROM "Order" WHERE id = $1', [
          id,
        ]);
        return r.rows[0] as OrderRow;
      },
      async updateMany(args) {
        const d = args.data;
        const entries = filterUpdateData(d, ORDER_UPDATE_WHITELIST, 'Order');
        const sets: string[] = [];
        const vals: unknown[] = [];
        let i = 1;
        for (const [k, v] of entries) {
          sets.push(`"${k}" = $${i++}`);
          vals.push(v);
        }
        sets.push('"updatedAt" = CURRENT_TIMESTAMP');
        if (sets.length === 0) return { count: 0 };
        const where: string[] = ['id = $' + i++];
        vals.push(args.where.id);
        if (args.where.status) {
          where.push('status = $' + i++);
          vals.push(args.where.status);
        }
        const r = await client.query(
          `UPDATE "Order" SET ${sets.join(', ')} WHERE ${where.join(' AND ')}`,
          vals,
        );
        return { count: r.rowCount ?? 0 };
      },
      async findUniqueOrThrow(args) {
        const r = await client.query('SELECT * FROM "Order" WHERE id = $1', [
          args.where.id,
        ]);
        const row = r.rows[0] as OrderRow | undefined;
        if (!row) throw new Error('Order not found');
        return row;
      },
    },
    walletTransaction: {
      async create(args) {
        const d = args.data;
        const id = uuid();
        await client.query(
          `INSERT INTO "WalletTransaction" (id, "userId", amount, type, "refType", "refId", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [id, d.userId, d.amount, d.type, d.refType, d.refId],
        );
      },
    },
    async $queryRaw<T = Record<string, unknown>>(
      sql: string,
      values?: unknown[],
    ) {
      const r = await client.query(sql, values ?? []);
      return r.rows as T[];
    },
  };
}
