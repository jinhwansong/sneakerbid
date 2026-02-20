import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

/** 봇별 일일 지급 범위 (타입별) - 단위: 원 */
const DAILY_TOPUP_RANGE_BY_TYPE: Record<string, [number, number]> = {
  AGGRESSIVE: [80_000, 150_000],
  CALCULATED: [50_000, 120_000],
  TROLL: [20_000, 60_000],
  EMOTIONAL: [40_000, 100_000],
  FOLLOWER: [50_000, 110_000],
};

const DEFAULT_RANGE: [number, number] = [30_000, 80_000];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매일 00:10 KST에 봇들에게 랜덤 잔액 지급
   */
  @Cron('10 0 * * *', { timeZone: 'Asia/Seoul' })
  async dailyBotBalanceTopUp() {
    const bots = await this.prisma.bot.findMany({
      include: { user: true },
    });

    for (const bot of bots) {
      const [min, max] =
        DAILY_TOPUP_RANGE_BY_TYPE[bot.type] ?? DEFAULT_RANGE;
      const amount = randInt(min, max);

      await this.prisma.user.update({
        where: { id: bot.userId },
        data: { balance: { increment: amount } },
      });
    }

    if (bots.length > 0) {
      console.log(
        `[BotsService] Daily top-up completed for ${bots.length} bots.`,
      );
    }
  }
}
