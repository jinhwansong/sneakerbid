import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { OAuthProvider } from '@prisma/client';
import { AuthService, OAuthProfile } from '../../auth/auth.service';
import type { UserByIdResult } from '../../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const clientID = String(configService.get('GOOGLE_CLIENT_ID') ?? '');
    const clientSecret = String(
      configService.get('GOOGLE_CLIENT_SECRET') ?? '',
    );
    const callbackURL = String(configService.get('GOOGLE_CALLBACK_URL') ?? '');
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      id: string;
      displayName?: string;
      name?: { givenName?: string; familyName?: string };
      emails?: Array<{ value: string }>;
      photos?: Array<{ value: string }>;
    },
  ): Promise<NonNullable<UserByIdResult>> {
    const profileData: OAuthProfile = {
      providerId: profile.id,
      nickname: profile.displayName ?? '',
      email: profile.emails?.[0]?.value ?? null,
      profileImageUrl: profile.photos?.[0]?.value ?? null,
    };

    const user = await this.authService.findOrCreateUserByOAuth(
      OAuthProvider.GOOGLE,
      profileData,
    );

    if (!user) throw new Error('Failed to find or create user');

    return user;
  }
}
