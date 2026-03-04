/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const AUCTION_SIZES = [
  '250',
  '255',
  '260',
  '265',
  '270',
  '275',
  '280',
  '285',
] as const;

/** 경매 + 스니커 시드: 판매자 1명, 스니커 N개, OPEN/CLOSED 경매 생성 */
async function seedAuctions() {
  const auctionCount = await prisma.auction.count();
  if (auctionCount > 0) {
    console.log('[seed] Auctions already exist, skipping auction seed.');
    return;
  }

  const seller = await prisma.user.create({
    data: {
      nickname: 'SeedSeller',
      role: 'USER',
      balance: 0,
    },
  });

  const sneakersData = [
    {
      modelName: 'Air Jordan 1 Retro High OG "Chicago"',
      brand: 'Jordan',
      colorway: 'White / Varsity Red - Black',
      description: '1985년 오리지널 디자인의 레트로 재해석.',
      imageUrl:
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: '990v5 MiUSA Gray Classic',
      brand: 'New Balance',
      colorway: 'Gray',
      description: '미국 메이드 라인업. ENCAP 미드솔.',
      imageUrl:
        'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Yeezy Boost 350 V2 Carbon',
      brand: 'Yeezy',
      colorway: 'Carbon / Carbon',
      description: 'Boost 쿠셔닝과 프라임니트 어퍼.',
      imageUrl:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Dunk Low Retro "Panda"',
      brand: 'Nike',
      colorway: 'White / Black',
      description: '흰색과 블랙의 투톤 덩크 로우.',
      imageUrl:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Air Force 1 Low "Triple White"',
      brand: 'Nike',
      colorway: 'White / White',
      description: '클래식 에어 포스 1 로우 트리플 화이트.',
      imageUrl:
        'https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Chuck 70 High Top',
      brand: 'Converse',
      colorway: 'Black',
      description: '캔버스 클래식 척 70 하이.',
      imageUrl:
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Ultraboost 22',
      brand: 'Adidas',
      colorway: 'Core Black / White',
      description: '부스트 쿠셔닝 러닝 슈즈.',
      imageUrl:
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Gel-Lyte III',
      brand: 'Asics',
      colorway: 'White / Navy',
      description: '젤 라이트 III 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Air Max 90 Essential',
      brand: 'Nike',
      colorway: 'Black / White',
      description: '에어 맥스 90 에센셜.',
      imageUrl:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Blazer Mid 77',
      brand: 'Nike',
      colorway: 'Vintage White',
      description: '블레이저 미드 77 레트로.',
      imageUrl:
        'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Cortez Classic',
      brand: 'Nike',
      colorway: 'White / Red - Blue',
      description: '나이키 코르테즈 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Stan Smith',
      brand: 'Adidas',
      colorway: 'White / Green',
      description: '스탠 스미스 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1587563871167-1ee67e58aeee?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Samba OG',
      brand: 'Adidas',
      colorway: 'Black / White Gum',
      description: '삼바 OG 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Gazelle',
      brand: 'Adidas',
      colorway: 'Blue / White',
      description: '가젤 클래식 스니커.',
      imageUrl:
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: '574 Core',
      brand: 'New Balance',
      colorway: 'Navy / White',
      description: '574 코어 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: '550',
      brand: 'New Balance',
      colorway: 'White / Green',
      description: '550 레트로 바스켓볼.',
      imageUrl:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Air Jordan 4 Retro',
      brand: 'Jordan',
      colorway: 'Military Black',
      description: '에어 조던 4 레트로 밀리터리 블랙.',
      imageUrl:
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Air Jordan 3 Retro',
      brand: 'Jordan',
      colorway: 'White Cement',
      description: '에어 조던 3 화이트 시멘트.',
      imageUrl:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Run Star Hike',
      brand: 'Converse',
      colorway: 'Black / White',
      description: '런 스타 하이크 플랫폼.',
      imageUrl:
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'One Star',
      brand: 'Converse',
      colorway: 'Suede Black',
      description: '원 스타 스웨이드.',
      imageUrl:
        'https://images.unsplash.com/photo-1543508282-6319a3e2621f?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'RS-X³',
      brand: 'Puma',
      colorway: 'White / Blue',
      description: 'RS-X3 러닝 스니커.',
      imageUrl:
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Suede Classic',
      brand: 'Puma',
      colorway: 'Black',
      description: '스웨이드 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Gel-1130',
      brand: 'Asics',
      colorway: 'White / Sage',
      description: '젤 1130 레트로 러너.',
      imageUrl:
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Kayano 30',
      brand: 'Asics',
      colorway: 'Black / Silver',
      description: '젤 카야노 30.',
      imageUrl:
        'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Old Skool',
      brand: 'Vans',
      colorway: 'Black / White',
      description: '올드 스쿨 클래식.',
      imageUrl:
        'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Sk8-Hi',
      brand: 'Vans',
      colorway: 'Checkerboard',
      description: '스케이트 하이 체커보드.',
      imageUrl:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Club C 85',
      brand: 'Reebok',
      colorway: 'White / Green',
      description: '클럽 C 85 레트로.',
      imageUrl:
        'https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Classic Leather',
      brand: 'Reebok',
      colorway: 'White / Navy',
      description: '클래식 레더.',
      imageUrl:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Yeezy Boost 350 V2 Zebra',
      brand: 'Yeezy',
      colorway: 'Zebra',
      description: '이지 부스트 350 V2 지브라.',
      imageUrl:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Yeezy 500',
      brand: 'Yeezy',
      colorway: 'Utility Black',
      description: '이지 500 유틸리티 블랙.',
      imageUrl:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Dunk Low "University Blue"',
      brand: 'Nike',
      colorway: 'University Blue / White',
      description: '덩크 로우 유니버시티 블루.',
      imageUrl:
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=800&auto=format&fit=crop',
    },
    {
      modelName: 'Air Jordan 1 Low',
      brand: 'Jordan',
      colorway: 'Shadow Toe',
      description: '조던 1 로우 섀도우 토.',
      imageUrl:
        'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop',
    },
  ];

  const now = new Date();
  const sneakers = await Promise.all(
    sneakersData.map((s) =>
      prisma.sneaker.create({
        data: {
          ...s,
          popularityScore: randInt(0, 100),
        },
      }),
    ),
  );

  const auctionsToCreate: Array<{
    sneakerId: string;
    size: string;
    startPrice: number;
    currentPrice: number;
    buyNowPrice: number | null;
    minimumIncrement: number;
    status: 'OPEN' | 'CLOSED';
    endTime: Date;
    closedAt: Date | null;
  }> = [];

  const startPricePool = [120000, 280000, 320000, 450000, 580000, 720000];
  let globalIdx = 0;
  for (const sneaker of sneakers) {
    // 스니커당 4개 경매 (서로 다른 사이즈) → 총 약 100개
    for (let i = 0; i < 4; i++) {
      const size = AUCTION_SIZES[(globalIdx + i) % AUCTION_SIZES.length];
      const startPrice =
        startPricePool[(globalIdx + i) % startPricePool.length];
      const currentPrice = startPrice + randInt(5000, 50000);
      const buyNowPrice = randInt(0, 1)
        ? currentPrice + randInt(50000, 150000)
        : null;
      const hoursFromNow = globalIdx * 2 + i + 1;
      const endTime = new Date(now.getTime() + hoursFromNow * 3600000);

      auctionsToCreate.push({
        sneakerId: sneaker.id,
        size,
        startPrice,
        currentPrice,
        buyNowPrice,
        minimumIncrement: 5000,
        status: 'OPEN',
        endTime,
        closedAt: null,
      });
    }
    globalIdx += 4;
  }

  await prisma.auction.createMany({
    data: auctionsToCreate.map((a) => ({
      ...a,
      sellerUserId: seller.id,
      winnerUserId: a.status === 'CLOSED' ? null : undefined,
    })),
  });

  console.log(
    `[seed] Created ${sneakers.length} sneakers, ${auctionsToCreate.length} auctions (seller: ${seller.nickname})`,
  );
}

type BotType = 'AGGRESSIVE' | 'CALCULATED' | 'TROLL' | 'EMOTIONAL' | 'FOLLOWER';

const randFloat = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const NICKNAME_POOL = [
  'Swift',
  'Bold',
  'Sharp',
  'Steady',
  'Silent',
  'Quick',
  'Wise',
  'Calm',
  'Storm',
  'Ghost',
  'Raven',
  'Phoenix',
  'Tiger',
  'Wolf',
  'Eagle',
  'Nova',
  'Cipher',
  'Pulse',
  'Blade',
  'Frost',
  'Ember',
  'Apex',
  'Zen',
  'Kai',
  'Rex',
  'Max',
  'Ace',
  'Jax',
  'Rio',
  'Nyx',
  'Vex',
  'Zed',
  'Lux',
  'Ivy',
  'Rue',
  'Sky',
  'Ray',
  'Fox',
  'Jet',
  'Roc',
  'Onyx',
  'Coral',
  'Mint',
  'Azure',
  'Sage',
  'Cole',
  'Dash',
  'Bolt',
  'Link',
  'Edge',
];

function pickUniqueNicks(count: number): string[] {
  const shuffled = shuffle([...NICKNAME_POOL]);
  return shuffled.slice(0, count);
}

const ALL_BRANDS = [
  'Nike',
  'Adidas',
  'New Balance',
  'Jordan',
  'Converse',
  'Puma',
  'Asics',
  'Vans',
  'Reebok',
  'Yeezy',
];

function pickRandomBrands(type: BotType, index: number): string[] {
  const shuffled = shuffle([...ALL_BRANDS]);
  const count = randInt(1, 4);
  const base = shuffled.slice(0, count);

  if (base.length === 0) return [ALL_BRANDS[index % ALL_BRANDS.length]];

  const unique = [...new Set(base)];
  if (unique.length === 0) return [ALL_BRANDS[0]];
  return unique;
}

function getBudgetRange(type: BotType): [number, number] {
  switch (type) {
    case 'AGGRESSIVE':
      return [1_500_000, 4_000_000];
    case 'CALCULATED':
      return [800_000, 2_000_000];
    case 'TROLL':
      return [200_000, 800_000];
    case 'EMOTIONAL':
      return [500_000, 1_500_000];
    case 'FOLLOWER':
      return [600_000, 2_000_000];
    default:
      return [500_000, 1_000_000];
  }
}

function getBotParams(type: BotType, index: number, nickname: string) {
  let activityStartHour: number;
  let activityEndHour: number;
  do {
    activityStartHour = randInt(0, 23);
    activityEndHour = randInt(0, 23);
  } while (activityStartHour === activityEndHour);
  if (activityStartHour > activityEndHour) {
    [activityStartHour, activityEndHour] = [activityEndHour, activityStartHour];
  }

  switch (type) {
    case 'AGGRESSIVE':
      return {
        nickname,
        riskTolerance: randInt(7, 10),
        bidUnit: randInt(5000, 20000),
        maxBidMultiplier: randFloat(2.0, 3.0),
        favoriteBrands: pickRandomBrands('AGGRESSIVE', index),
        activityStartHour,
        activityEndHour,
      };
    case 'CALCULATED':
      return {
        nickname,
        riskTolerance: randInt(4, 6),
        bidUnit: randInt(3000, 8000),
        maxBidMultiplier: randFloat(1.5, 2.0),
        favoriteBrands: pickRandomBrands('CALCULATED', index),
        activityStartHour,
        activityEndHour,
      };
    case 'TROLL':
      return {
        nickname,
        riskTolerance: randInt(5, 7),
        bidUnit: randInt(500, 2000),
        maxBidMultiplier: randFloat(1.3, 1.8),
        favoriteBrands: pickRandomBrands('TROLL', index),
        activityStartHour,
        activityEndHour,
      };
    case 'EMOTIONAL':
      return {
        nickname,
        riskTolerance: randInt(3, 5),
        bidUnit: randInt(1000, 5000),
        maxBidMultiplier: randFloat(1.4, 2.0),
        favoriteBrands: pickRandomBrands('EMOTIONAL', index),
        activityStartHour,
        activityEndHour,
      };
    case 'FOLLOWER':
      return {
        nickname,
        riskTolerance: randInt(4, 6),
        bidUnit: randInt(1000, 4000),
        maxBidMultiplier: randFloat(1.5, 2.2),
        favoriteBrands: pickRandomBrands('FOLLOWER', index),
        activityStartHour,
        activityEndHour,
      };
    default:
      throw new Error(`Unknown bot type: ${String(type)}`);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function main() {
  await seedAuctions();

  const BOTS_PER_TYPE = 2; // 타입당 2개 → 총 10개
  const existing = await prisma.bot.count();
  if (existing >= BOTS_PER_TYPE * 5) {
    console.log('Bots already exist. Run with --reset to recreate.');
    return;
  }

  const types: BotType[] = [
    'AGGRESSIVE',
    'CALCULATED',
    'TROLL',
    'EMOTIONAL',
    'FOLLOWER',
  ];

  const uniqueNicks = pickUniqueNicks(BOTS_PER_TYPE * 5);
  const output: object[] = [];
  let globalIdx = 0;

  for (const type of types) {
    const [budgetMin, budgetMax] = getBudgetRange(type);
    for (let i = 1; i <= BOTS_PER_TYPE; i++) {
      const nickname = `Bot_${uniqueNicks[globalIdx]}_${String(globalIdx + 1).padStart(2, '0')}`;
      globalIdx++;
      const params = getBotParams(type, i, nickname);
      const budget = randInt(budgetMin, budgetMax);

      const user = await prisma.user.create({
        data: {
          nickname: params.nickname,
          role: 'BOT',
          balance: budget,
        },
      });

      const bot = await prisma.bot.create({
        data: {
          userId: user.id,
          type,
          riskTolerance: params.riskTolerance,
          bidUnit: params.bidUnit,
          maxBidMultiplier: params.maxBidMultiplier,
          activityStartHour: params.activityStartHour,
          activityEndHour: params.activityEndHour,
          favoriteBrands: params.favoriteBrands as object,
        },
      });

      output.push({
        id: bot.id,
        userId: user.id,
        nickname: params.nickname,
        type,
        balance: budget,
        riskTolerance: params.riskTolerance,
        bidUnit: params.bidUnit,
        maxBidMultiplier: params.maxBidMultiplier,
        activityStartHour: params.activityStartHour,
        activityEndHour: params.activityEndHour,
        favoriteBrands: params.favoriteBrands,
      });
    }
  }

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
