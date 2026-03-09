/**
 * 시드 스크립트 - User, Sneaker, Auction, Bot 생성
 * 봇들이 입찰할 수 있도록 진행 중인 경매와 봇 계정을 준비합니다.
 *
 * 실행: npx ts-node -r tsconfig-paths/register seed.ts
 * 또는: npm run seed
 */
import { Pool } from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL이 .env에 설정되어 있어야 합니다.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

const uuid = () => crypto.randomUUID();

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 시드 시작...');

    // 1. 판매자 유저 (경매 등록자)
    const sellerId = uuid();
    await client.query(
      `INSERT INTO "User" (id, nickname, role, balance, "createdAt", "updatedAt")
       VALUES ($1, $2, 'USER', 1000000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [sellerId, 'seed_seller'],
    );
    console.log('  ✓ 판매자 유저 생성:', sellerId);

    // 2. 봇 유저들 (BOT role, 잔액 있음)
    const botUserIds: string[] = [];
    const botTypes = ['AGGRESSIVE', 'CALCULATED', 'TROLL', 'EMOTIONAL', 'FOLLOWER'];
    for (let i = 0; i < 5; i++) {
      const id = uuid();
      await client.query(
        `INSERT INTO "User" (id, nickname, role, balance, "createdAt", "updatedAt")
         VALUES ($1, $2, 'BOT', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, `bot_${botTypes[i].toLowerCase()}`, 200000 + i * 50000],
      );
      botUserIds.push(id);
    }
    console.log('  ✓ 봇 유저 5명 생성');

    // 3. 스니커
    const sneakers = [
      { brand: 'Nike', model: 'Dunk Low', colorway: 'Black White', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
      { brand: 'Jordan', model: '1 Retro High', colorway: 'Chicago', image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400' },
      { brand: 'Adidas', model: 'Yeezy Boost 350', colorway: 'Zebra', image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=400' },
      { brand: 'New Balance', model: '550', colorway: 'White Green', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400' },
      { brand: 'Nike', model: 'Air Force 1', colorway: 'White', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
    ];

    const sneakerIds: string[] = [];
    for (const s of sneakers) {
      const id = uuid();
      await client.query(
        `INSERT INTO "Sneaker" (id, "modelName", brand, colorway, "imageUrl", "popularityScore", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, s.model, s.brand, s.colorway, s.image],
      );
      sneakerIds.push(id);
    }
    console.log('  ✓ 스니커 5종 생성');

    // 4. 진행 중인 경매 (endTime 1~2시간 후)
    const sizes = ['260', '265', '270', '275'];
    const now = new Date();
    for (let i = 0; i < sneakerIds.length; i++) {
      const endTime = new Date(now.getTime() + (60 + i * 30) * 60 * 1000);
      const startPrice = 50000 + i * 10000;
      await client.query(
        `INSERT INTO "Auction" (id, "sneakerId", size, "startPrice", "currentPrice", "buyNowPrice", "minimumIncrement", status, "endTime", "sellerUserId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $4, $5, 10000, 'OPEN', $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          uuid(),
          sneakerIds[i],
          sizes[i % sizes.length],
          startPrice,
          startPrice * 2,
          endTime,
          sellerId,
        ],
      );
    }
    console.log('  ✓ 진행 중인 경매 5개 생성');

    // 5. 봇 (Bot 테이블)
    const botConfigs = [
      { type: 'AGGRESSIVE', riskTolerance: 80, bidUnit: 5000, maxBidMultiplier: 2.5, startHour: 0, endHour: 23, brands: ['Nike', 'Jordan'] },
      { type: 'CALCULATED', riskTolerance: 50, bidUnit: 3000, maxBidMultiplier: 1.8, startHour: 0, endHour: 23, brands: ['Nike', 'Adidas', 'New Balance'] },
      { type: 'TROLL', riskTolerance: 90, bidUnit: 10000, maxBidMultiplier: 3, startHour: 0, endHour: 23, brands: ['Jordan', 'Yeezy'] },
      { type: 'EMOTIONAL', riskTolerance: 70, bidUnit: 5000, maxBidMultiplier: 2.2, startHour: 0, endHour: 23, brands: ['Nike', 'Adidas'] },
      { type: 'FOLLOWER', riskTolerance: 40, bidUnit: 2000, maxBidMultiplier: 1.5, startHour: 0, endHour: 23, brands: ['Nike', 'Jordan', 'New Balance'] },
    ];

    for (let i = 0; i < botUserIds.length; i++) {
      const cfg = botConfigs[i];
      await client.query(
        `INSERT INTO "Bot" (id, "userId", type, "riskTolerance", "bidUnit", "maxBidMultiplier", "activityStartHour", "activityEndHour", "favoriteBrands", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          uuid(),
          botUserIds[i],
          cfg.type,
          cfg.riskTolerance,
          cfg.bidUnit,
          cfg.maxBidMultiplier,
          cfg.startHour,
          cfg.endHour,
          JSON.stringify(cfg.brands),
        ],
      );
    }
    console.log('  ✓ 봇 5개 생성');

    console.log('✅ 시드 완료! 봇들이 20초마다 입찰을 시도합니다.');
  } catch (err) {
    console.error('❌ 시드 실패:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
