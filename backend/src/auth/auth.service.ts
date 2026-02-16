import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { OAuthProvider } from '@prisma/client';
import { PrismaService, UserByIdResult } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';

export interface OAuthProfile {
  providerAccountId: string;
  nickname: string;
  email?: string | null;
  profileImageUrl?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /* OAuth 사용자 조회 또는 생성 */
  async findOrCreateUserByOAuth(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ): Promise<UserByIdResult> {
    const existing = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existing) {
      return {
        id: existing.user.id,
        nickname: existing.user.nickname,
        role: existing.user.role,
        balance: existing.user.balance,
        createdAt: existing.user.createdAt,
        updatedAt: existing.user.updatedAt,
      };
    }

    const user = await this.prisma.user.create({
      data: {
        nickname:
          profile.nickname || `user_${profile.providerAccountId.slice(0, 8)}`,
      },
    });

    await this.prisma.oAuthAccount.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId: profile.providerAccountId,
        email: profile.email ?? undefined,
        profileImageUrl: profile.profileImageUrl ?? undefined,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      balance: user.balance,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /* 로그인 쿠키 설정 */
  async loginWithCookies(
    user: { id: string; role: string },
    res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.login(user);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  /* 리프레시 토큰으로 새 토큰 발급 */
  async handleRefresh(req: Request, res: Response): Promise<Response> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: '리프레시 토큰이 필요합니다.' });
    }

    const success = await this.refreshWithCookies(refreshToken, res);
    if (!success) {
      return res
        .status(401)
        .json({ message: '유효하지 않거나 만료된 리프레시 토큰입니다.' });
    }

    return res.status(200).json({ success: true });
  }

  /* 리프레시 토큰으로 새 토큰 발급 (쿠키 설정 포함) */
  private async refreshWithCookies(
    refreshToken: string,
    res: Response,
  ): Promise<boolean> {
    const userId = await this.redis.getUserIdByRefreshToken(refreshToken);
    if (!userId) {
      return false;
    }

    const user = await this.prisma.findUserById(userId);
    if (!user) {
      await this.redis.revokeRefreshToken(refreshToken);
      return false;
    }

    await this.redis.revokeRefreshToken(refreshToken);
    await this.loginWithCookies({ id: user.id, role: user.role }, res);
    return true;
  }

  /* 로그아웃: Redis에서 refresh token 삭제 후 쿠키 제거 */
  async logout(req: Request, res: Response): Promise<Response> {
    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refreshToken;
    if (refreshToken) {
      await this.redis.revokeRefreshToken(refreshToken);
    }

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0,
    };
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    return res.status(200).json({ message: '로그아웃을 성공했습니다.' });
  }

  /* 토큰 발급 (refreshToken은 Redis에 저장) */
  async login(user: { id: string; role: string }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = { sub: user.id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    const REFRESH_TTL = 7 * 24 * 60 * 60; // 7일(초)
    await this.redis.setRefreshToken(refreshToken, user.id, REFRESH_TTL);

    return { accessToken, refreshToken };
  }
}
