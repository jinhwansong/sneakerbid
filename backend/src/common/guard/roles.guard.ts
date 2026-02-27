import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enum/role.enum';

/** JWT 인증 후 request.user에 들어가는 타입 */
interface RequestUser {
  role: UserRole;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 🔹 roles가 설정 안된 라우트는 통과
    if (!roles || roles.length === 0) return Promise.resolve(true);
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user: RequestUser | undefined = request.user;

    // 🔹 로그인 안된 상태
    if (!user) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    // 🔹 권한 검사
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('접근 권한이 없습니다.');
    }

    return Promise.resolve(true);
  }
}
