import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type UserByIdResult = {
  id: string;
  nickname: string;
  role: string;
  balance: number;
  profileImageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.warn(
          '[Prisma] DB unreachable (localhost:5432?). App will start but DB calls will fail. Start PostgreSQL or set DATABASE_URL.',
        );
        return;
      }
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** JWT 검증 등에서 사용. User 모델 접근을 서비스 내부로 한정 */
  findUserById(id: string): Promise<UserByIdResult> {
    const client = this as unknown as PrismaClient & {
      user: {
        findUnique: (args: {
          where: { id: string };
        }) => Promise<UserByIdResult>;
      };
    };
    return client.user.findUnique({ where: { id } });
  }
}
