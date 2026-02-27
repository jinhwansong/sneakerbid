import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorator/public.decorator';
import { KakaoAuthGuard } from '../common/guard/kakao.auth.guard';
import { GoogleAuthGuard } from '../common/guard/google.auth.guard';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('kakao')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: '카카오 로그인 요청',
    description: '카카오 OAuth로 리다이렉트',
  })
  @ApiResponse({
    status: 302,
    description: '카카오 로그인 페이지로 리다이렉트',
  })
  async kakaoLogin() {
    // Guard가 리다이렉트 처리하므로 내용 필요 없음
  }

  @Get('kakao/callback')
  @UseGuards(KakaoAuthGuard)
  @ApiOperation({
    summary: '카카오 로그인 콜백',
    description: '카카오 인증 후 쿠키 설정 및 프론트 리다이렉트',
  })
  @ApiResponse({
    status: 302,
    description: '성공 시 프론트엔드로, 실패 시 /login?error=auth_failed',
  })
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

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: '구글 로그인 요청',
    description: '구글 OAuth로 리다이렉트',
  })
  @ApiResponse({ status: 302, description: '구글 로그인 페이지로 리다이렉트' })
  async googleLogin() {
    // Guard가 리다이렉트 처리하므로 내용 필요 없음
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: '구글 로그인 콜백',
    description: '구글 인증 후 쿠키 설정 및 프론트 리다이렉트',
  })
  @ApiResponse({
    status: 302,
    description: '성공 시 프론트엔드로, 실패 시 /login?error=auth_failed',
  })
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

  @Get('refresh')
  @ApiOperation({
    summary: '리프레시 토큰 발급',
    description: '쿠키의 refresh 토큰으로 새 access 토큰 발급',
  })
  @ApiResponse({ status: 200, description: '새 access 토큰 쿠키 설정됨' })
  @ApiResponse({ status: 401, description: '리프레시 토큰 없음/만료' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    return this.authService.handleRefresh(req, res);
  }

  @Get('logout')
  @ApiOperation({
    summary: '로그아웃',
    description: '쿠키의 access/refresh 토큰 제거',
  })
  @ApiResponse({ status: 200, description: '로그아웃 완료' })
  async logout(@Req() req: Request, @Res() res: Response) {
    return this.authService.logout(req, res);
  }
}
