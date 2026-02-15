import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** JWT 검증 후 request.user에 들어가는 타입 (UsersService.findById 결과) */
export interface RequestUser {
  id: string;
  nickname: string;
  role: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

/** 저장된 사용자 정보에 접근 가능 */
export const User = createParamDecorator(
  (
    data: keyof RequestUser | undefined,
    ctx: ExecutionContext,
  ): RequestUser | RequestUser[keyof RequestUser] | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
