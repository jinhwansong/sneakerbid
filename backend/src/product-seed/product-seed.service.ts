import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '@/database/database.service';
import { KicksDBService } from '@/kicksdb/kicksdb.service';
import {
  AUCTION_SIZES,
  AUCTION_BRANDS,
} from '@/common/constants/auction.constants';
import type { KicksDBProduct } from '@/kicksdb/kicksdb.types';

const SEED_QUERIES = ['nike', 'jordan', 'dunk', 'adidas', 'yeezy'] as const;
const PRODUCTS_PER_CRON = 20;
const DEFAULT_AUCTION_DURATION_HOURS = 2;

/** KicksDB brand → 우리 브랜드 매핑 */
function normalizeBrand(kicksBrand: string): string {
  const m: Record<string, string> = {
    'Air Jordan': 'Jordan',
    Jordan: 'Jordan',
    Nike: 'Nike',
    Adidas: 'Adidas',
    Yeezy: 'Yeezy',
    'New Balance': 'New Balance',
    Converse: 'Converse',
    Puma: 'Puma',
    Asics: 'Asics',
    Vans: 'Vans',
    Reebok: 'Reebok',
  };
  return (
    m[kicksBrand] ??
    (AUCTION_BRANDS.includes(kicksBrand as (typeof AUCTION_BRANDS)[number])
      ? kicksBrand
      : 'Nike')
  );
}

@Injectable()
export class ProductSeedService {
  private readonly logger = new Logger(ProductSeedService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly kicksdb: KicksDBService,
  ) {}

  /** 매일 00:00, 12:00 KST — KicksDB에서 20개 상품 추가 */
  @Cron('0 0,12 * * *', { timeZone: 'Asia/Seoul' })
  async seedFromKicksDB() {
    if (!this.kicksdb.isEnabled) {
      this.logger.debug('KICKS_API_KEY 없음, 상품 시드 스킵');
      return;
    }

    const query = SEED_QUERIES[Math.floor(Math.random() * SEED_QUERIES.length)];
    let products: KicksDBProduct[];
    try {
      products = await this.kicksdb.searchProducts(query, PRODUCTS_PER_CRON);
    } catch (err) {
      this.logger.warn(`KicksDB 조회 실패 (query=${query}): ${err}`);
      return;
    }

    if (products.length === 0) {
      this.logger.log('KicksDB 상품 없음');
      return;
    }

    const sellerId = await this.getOrCreateSeedSeller();
    const now = new Date();
    const endTime = new Date(
      now.getTime() + DEFAULT_AUCTION_DURATION_HOURS * 60 * 60 * 1000,
    );
    let created = 0;

    for (const p of products) {
      const brand = normalizeBrand(p.brand);
      if (!AUCTION_BRANDS.includes(brand as (typeof AUCTION_BRANDS)[number]))
        continue;

      const colorway = p.secondary_title ?? p.primary_title ?? p.title ?? '';
      const sku =
        p.sku ?? p.slug ?? `${p.brand}-${p.model}-${randomUUID().slice(0, 8)}`;

      const existingSneaker = await this.db.query<{ id: string }>(
        `SELECT id FROM "Sneaker" WHERE "styleCode" = $1 LIMIT 1`,
        [sku],
      );

      let sneakerId: string;
      if (existingSneaker.length > 0) {
        sneakerId = existingSneaker[0].id;
      } else {
        sneakerId = randomUUID();
        await this.db.query(
          `INSERT INTO "Sneaker" (id, "modelName", brand, colorway, description, "imageUrl", "popularityScore", "styleCode", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, 100, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            sneakerId,
            p.model,
            brand,
            colorway || null,
            p.description?.slice(0, 500) ?? null,
            p.image ?? '',
            sku,
          ],
        );
      }

      const size =
        AUCTION_SIZES[Math.floor(Math.random() * AUCTION_SIZES.length)];
      const startPrice = Math.round((p.avg_price ?? p.min_price ?? 100) * 100);
      const minIncrement = 10000;

      const alreadyOpen = await this.db.query<{ id: string }>(
        `SELECT id FROM "Auction" WHERE "sneakerId" = $1 AND size = $2 AND status = 'OPEN' AND "endTime" > $3 LIMIT 1`,
        [sneakerId, size, now],
      );
      if (alreadyOpen.length > 0) continue;

      const auctionId = randomUUID();
      await this.db.query(
        `INSERT INTO "Auction" (id, "sneakerId", size, "startPrice", "currentPrice", "buyNowPrice", "minimumIncrement", status, "endTime", "sellerUserId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $4, $5, $6, 'OPEN', $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          auctionId,
          sneakerId,
          size,
          startPrice,
          startPrice * 2,
          minIncrement,
          endTime.toISOString(),
          sellerId,
        ],
      );
      created++;
    }

    this.logger.log(
      `[ProductSeed] KicksDB 시드 완료: ${created}건 (query=${query})`,
    );
  }

  private async getOrCreateSeedSeller(): Promise<string> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM "User" WHERE nickname = 'seed_seller' AND role = 'USER' LIMIT 1`,
    );
    if (rows.length > 0) return rows[0].id;

    const rows2 = await this.db.query<{ id: string }>(
      `SELECT id FROM "User" WHERE role = 'USER' ORDER BY "createdAt" ASC LIMIT 1`,
    );
    if (rows2.length > 0) return rows2[0].id;

    const id = randomUUID();
    await this.db.query(
      `INSERT INTO "User" (id, nickname, role, balance, "createdAt", "updatedAt")
       VALUES ($1, 'seed_seller', 'USER', 1000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id],
    );
    return id;
  }
}
