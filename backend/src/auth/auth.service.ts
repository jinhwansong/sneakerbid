import { randomUUID } from 'crypto';
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

    const { data: existing, error: socialQueryError } = await supabase
      .from('SocialAccount')
      .select('id, userId')
      .eq('provider', provider)
      .eq('providerId', profile.providerId)
      .maybeSingle();

    if (socialQueryError) {
      throw new Error(`SocialAccount 조회 실패: ${socialQueryError.message}`);
    }

    if (existing?.userId) {
      const { data: user, error: userQueryError } = await supabase
        .from('User')
        .select(
          'id, nickname, role, balance, profileImageUrl, createdAt, updatedAt',
        )
        .eq('id', existing.userId)
        .maybeSingle();

      if (userQueryError) {
        throw new Error(`User 조회 실패: ${userQueryError.message}`);
      }
      if (!user) throw new Error('User not found');

      if (profile.profileImageUrl) {
        const { error: updateError } = await supabase
          .from('User')
          .update({
            profileImageUrl: profile.profileImageUrl,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(
            `프로필 이미지 업데이트 실패: ${updateError.message}`,
          );
        }
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
      id: randomUUID(),
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
      id: randomUUID(),
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
      const { error: deleteError } = await supabase
        .from('User')
        .delete()
        .eq('id', newUser.id);
      if (deleteError) {
        console.error(
          '[AuthService] User 보상 삭제 실패 (orphan user 가능):',
          deleteError,
        );
      }
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

  /* 리프레시 토큰으로 새 토큰 발급 (쿠키 설정 포함)
   * Redis가 원천: Redis에 없거나 Redis 오류 시 JWT 폴백하지 않음 (로그아웃 우회 방지)
   */
  private async refreshWithCookies(
    refreshToken: string,
    res: Response,
  ): Promise<boolean> {
    let userId: string | null;
    try {
      userId = await this.redis.getUserIdByRefreshToken(refreshToken);
    } catch {
      // Redis 장애 시 인증 거부 (fail-closed)
      return false;
    }

    if (!userId) {
      // Redis에 없음 = revoked 또는 미저장. JWT 폴백하지 않음
      return false;
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
      throw new Error(
        `Failed to persist refresh token: ${err instanceof Error ? err.message : 'Redis write failed'}`,
      );
    }

    return { accessToken, refreshToken };
  }
}
