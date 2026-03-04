import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    const optionalAuth = this.reflector.getAllAndOverride<boolean>(
      'optionalAuth',
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) return true;
    if (optionalAuth) {
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        return true; // 인증 실패해도 통과 (user는 null)
      }
    }
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    _info: any,
    context: ExecutionContext,
  ): TUser | null {
    const optionalAuth = this.reflector.getAllAndOverride<boolean>(
      'optionalAuth',
      [context.getHandler(), context.getClass()],
    );
    if (optionalAuth) return err ? null : (user ?? null);

    if (err || !user) {
      throw err || new UnauthorizedException('인증되지 않은 사용자입니다.');
    }
    return user;
  }
}
