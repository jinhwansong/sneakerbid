import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { DatabaseService } from '@/database/database.service';
import type { OAuthProvider, UserByIdResult } from '@/common/database/db.types';
import { INITIAL_USER_BALANCE } from '@/common/constants/auth.constants';
import { RedisService } from '@/redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TTL } from '@/common/constants';

export interface OAuthProfile {
  providerId: string;
  nickname: string;
  email?: string | null;
  profileImageUrl?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  /* OAuth 사용자 조회 또는 생성 (provider + providerId 기준) */
  async findOrCreateUserByOAuth(
    provider: OAuthProvider,
    profile: OAuthProfile,
  ): Promise<UserByIdResult> {
    const supabase = this.db.getSupabase();

    const { data: existing } = await supabase
      .from('SocialAccount')
      .select('id, userId')
      .eq('provider', provider)
      .eq('providerId', profile.providerId)
      .maybeSingle();

    if (existing?.userId) {
      const { data: user } = await supabase
        .from('User')
        .select(
          'id, nickname, role, balance, profileImageUrl, createdAt, updatedAt',
        )
        .eq('id', existing.userId)
        .maybeSingle();

      if (!user) throw new Error('User not found');

      if (profile.profileImageUrl) {
        await supabase
          .from('User')
          .update({
            profileImageUrl: profile.profileImageUrl,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      return {
        id: user.id as string,
        nickname: user.nickname as string,
        role: user.role as string,
        balance: user.balance as number,
        profileImageUrl: (profile.profileImageUrl ??
          user.profileImageUrl ??
          null) as string | null,
        createdAt: new Date(user.createdAt as string),
        updatedAt: new Date(user.updatedAt as string),
      };
    }

    const newUser = {
      id: crypto.randomUUID(),
      nickname: profile.nickname || `user_${profile.providerId.slice(0, 8)}`,
      email: profile.email ?? null,
      profileImageUrl: profile.profileImageUrl ?? null,
      balance: INITIAL_USER_BALANCE,
      role: 'USER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: userError } = await supabase.from('User').insert(newUser);
    if (userError) {
      console.error('[AuthService] User insert 실패:', userError);
      throw new Error(`User 생성 실패: ${userError.message}`);
    }

    const socialAccount = {
      id: crypto.randomUUID(),
      userId: newUser.id,
      provider,
      providerId: profile.providerId,
      createdAt: new Date().toISOString(),
    };
    const { error: socialError } = await supabase
      .from('SocialAccount')
      .insert(socialAccount);
    if (socialError) {
      console.error('[AuthService] SocialAccount insert 실패:', socialError);
      throw new Error(`SocialAccount 생성 실패: ${socialError.message}`);
    }

    return {
      id: newUser.id,
      nickname: newUser.nickname,
      role: newUser.role,
      balance: newUser.balance,
      profileImageUrl: newUser.profileImageUrl ?? null,
      createdAt: new Date(newUser.createdAt),
      updatedAt: new Date(newUser.updatedAt),
    };
  }

  /* 로그인 쿠키 설정 */
  async loginWithCookies(
    user: { id: string; role: string },
    res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.login(user);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (ms)
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie('refreshToken', refreshToken, cookieOptions);
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
    let userId = await this.redis.getUserIdByRefreshToken(refreshToken);

    // Redis에 없으면 JWT 검증 폴백 (Upstash 등 Redis 연결 이슈 대응)
    if (!userId) {
      try {
        const payload = this.jwtService.verify<{ sub: string; role: string }>(
          refreshToken,
        );
        userId = payload.sub;
        try {
          await this.redis.setRefreshToken(refreshToken, userId, REFRESH_TTL);
        } catch {
          // Redis 저장 실패해도 userId는 있으므로 계속 진행
        }
      } catch {
        return false;
      }
    }

    const user = await this.db.findUserById(userId);
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

    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    };
    res.clearCookie('accessToken', clearOptions);
    res.clearCookie('refreshToken', clearOptions);

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

    try {
      await this.redis.setRefreshToken(refreshToken, user.id, REFRESH_TTL);
    } catch (err) {
      // Redis 연결 실패 시에도 로그인은 진행 (refresh 시 JWT 폴백 사용)
      console.error('[AuthService] Redis setRefreshToken 실패:', err);
    }

    return { accessToken, refreshToken };
  }
}
