import { randomUUID } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuctionSeedRepository } from '@/database/repositories/auction-seed.repository';
import { SneakerRepository } from '@/database/repositories/sneaker.repository';
import { UserRepository } from '@/database/repositories/user.repository';
import { KicksDBService } from '@/kicksdb/kicksdb.service';
import {
  KicksDBApiError,
  KicksDBRateLimitError,
} from '@/kicksdb/kicksdb.errors';
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
    private readonly auctionSeedRepo: AuctionSeedRepository,
    private readonly sneakerRepo: SneakerRepository,
    private readonly userRepo: UserRepository,
    private readonly kicksdb: KicksDBService,
  ) {}

  /** 매일 00:00, 09:00, 12:00, 14:00, 18:00 KST — KicksDB에서 20개 상품 추가 */
  @Cron('0 0,9,12,14,18 * * *', { timeZone: 'Asia/Seoul' })
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
      if (err instanceof KicksDBRateLimitError) {
        this.logger.warn(
          `KicksDB rate limit(429) 재시도 소진 (query=${query}): ${err.message}`,
        );
        return;
      }
      if (err instanceof KicksDBApiError) {
        this.logger.warn(
          `KicksDB API ${err.statusCode} (query=${query}): ${err.message}`,
        );
        return;
      }
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

      let sneakerId = await this.sneakerRepo.findIdByStyleCode(sku);
      if (!sneakerId) {
        sneakerId = randomUUID();
        await this.sneakerRepo.insertSeedRow({
          id: sneakerId,
          modelName: p.model,
          brand,
          colorway: colorway || null,
          description: p.description?.slice(0, 500) ?? null,
          imageUrl: p.image ?? '',
          styleCode: sku,
        });
      }

      const size =
        AUCTION_SIZES[Math.floor(Math.random() * AUCTION_SIZES.length)];
      const startPrice = Math.round((p.avg_price ?? p.min_price ?? 100) * 100);
      const minIncrement = 10000;

      if (
        await this.auctionSeedRepo.existsOpenForSneakerSizeAfter(
          sneakerId,
          size,
          now,
        )
      ) {
        continue;
      }

      await this.auctionSeedRepo.insertSeedRow({
        id: randomUUID(),
        sneakerId,
        size,
        startPrice,
        buyNowPrice: startPrice * 2,
        minimumIncrement: minIncrement,
        endTime,
        sellerUserId: sellerId,
      });
      created++;
    }

    this.logger.log(
      `[ProductSeed] KicksDB 시드 완료: ${created}건 (query=${query})`,
    );
  }

  private async getOrCreateSeedSeller(): Promise<string> {
    const byNickname = await this.userRepo.findIdByNicknameAndRole(
      'seed_seller',
      'USER',
    );
    if (byNickname) return byNickname;

    const oldest = await this.userRepo.findOldestUserId();
    if (oldest) return oldest;

    const id = randomUUID();
    await this.userRepo.insertSeedSeller(id);
    return id;
  }
}
