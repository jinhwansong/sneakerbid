import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../common/decorator/public.decorator';
import { KakaoAuthGuard } from '../common/guard/kakao.auth.guard';
import { GoogleAuthGuard } from '../common/guard/google.auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /* 카카오 로그인 요청 */
  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  async kakaoLogin() {
    // Guard가 리다이렉트 처리하므로 내용 필요 없음
  }

  /* 카카오 로그인 콜백 */
  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  async kakaoCallback(
    @Req() req: Request & { user?: { id: string; role: string } },
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/login?error=auth_failed`,
      );
    }
    await this.authService.loginWithCookies(req.user, res);
    return res.redirect(this.configService.get<string>('FRONTEND_URL'));
  }

  /* 구글 로그인 요청 */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleLogin() {
    // Guard가 리다이렉트 처리하므로 내용 필요 없음
  }

  /* 구글 로그인 콜백 */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request & { user?: { id: string; role: string } },
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/login?error=auth_failed`,
      );
    }
    await this.authService.loginWithCookies(req.user, res);
    return res.redirect(this.configService.get<string>('FRONTEND_URL'));
  }

  /* 리프레시 토큰 발급 */
  @Get('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    return this.authService.handleRefresh(req, res);
  }

  /* 로그아웃 */
  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    return this.authService.logout(req, res);
  }
}
