import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';
import { OAuthProvider } from '@prisma/client';
import { AuthService, OAuthProfile } from '../../auth/auth.service';
import type { UserByIdResult } from '../../prisma/prisma.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = String(configService.get('KAKAO_CLIENT_ID') ?? '');
    const clientSecret = String(configService.get('KAKAO_CLIENT_SECRET') ?? '');
    const callbackURL = String(configService.get('KAKAO_CALLBACK_URL') ?? '');
    super({
      clientID,
      clientSecret,
      callbackURL,
    });
  }
  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<NonNullable<UserByIdResult>> {
    const kakaoAccount = (
      profile._json as {
        kakao_account?: {
          email?: string;
          profile?: { profile_image_url?: string };
        };
      }
    )?.kakao_account;

    const profileData: OAuthProfile = {
      providerId: String(profile.id),
      nickname: profile.displayName ?? '',
      email: kakaoAccount?.email ?? null,
      profileImageUrl: kakaoAccount?.profile?.profile_image_url ?? null,
    };

    const user = await this.authService.findOrCreateUserByOAuth(
      OAuthProvider.KAKAO,
      profileData,
    );

    if (!user) throw new Error('Failed to find or create user');

    return user;
  }
}
