import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@/common/guard/roles.guard';
import { UserRole } from '@/common/enum/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createContext(overrides?: {
    user?: { role: UserRole } | undefined;
    roles?: UserRole[] | undefined;
  }): ExecutionContext {
    const request = { user: overrides?.user };
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('roles가 없으면 통과', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createContext({ user: { role: UserRole.USER } });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('roles가 빈 배열이면 통과', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = createContext({ user: { role: UserRole.USER } });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('user가 없으면 ForbiddenException', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);
    const ctx = createContext({ user: undefined });
    try {
      await guard.canActivate(ctx);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as Error).message).toContain('권한이 없습니다.');
    }
  });

  it('role이 목록에 없으면 ForbiddenException', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const ctx = createContext({ user: { role: UserRole.USER } });
    try {
      await guard.canActivate(ctx);
      expect(true).toBe(false);
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenException);
      expect((e as Error).message).toContain('접근 권한이 없습니다.');
    }
  });

  it('role이 목록에 있으면 통과', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.USER]);
    const ctx = createContext({ user: { role: UserRole.USER } });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('ADMIN이 ADMIN 라우트 접근 시 통과', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([UserRole.ADMIN]);
    const ctx = createContext({ user: { role: UserRole.ADMIN } });
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
