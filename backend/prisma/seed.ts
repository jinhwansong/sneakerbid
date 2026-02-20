/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type BotType = 'AGGRESSIVE' | 'CALCULATED' | 'TROLL' | 'EMOTIONAL' | 'FOLLOWER';

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
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
  'ASICS',
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
  const existing = await prisma.bot.count();
  if (existing >= 50) {
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

  const uniqueNicks = pickUniqueNicks(50);
  const output: object[] = [];
  let globalIdx = 0;

  for (const type of types) {
    const [budgetMin, budgetMax] = getBudgetRange(type);
    for (let i = 1; i <= 10; i++) {
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
