import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  describe('handleRequest', () => {
    function createContext(): ExecutionContext {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;
    }

    it('optionalAuth이고 err가 있으면 null 반환', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = createContext();
      const result: unknown = guard.handleRequest(
        new Error('jwt expired'),
        null,
        null,
        ctx,
      );
      expect(result).toBeNull();
    });

    it('optionalAuth이고 user가 있으면 user 반환', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = createContext();
      const user = { id: 'u1' };
      const result: unknown = guard.handleRequest(null, user, null, ctx);
      expect(result).toBe(user);
    });

    it('optionalAuth이고 user가 null이면 null 반환', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const ctx = createContext();
      const result: unknown = guard.handleRequest(null, null, null, ctx);
      expect(result).toBeNull();
    });

    it('optionalAuth 아니고 err가 있으면 err 던짐', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = createContext();
      const err = new Error('jwt invalid');
      expect(() => {
        guard.handleRequest(err, null, null, ctx);
      }).toThrow(err);
    });

    it('optionalAuth 아니고 user가 없으면 UnauthorizedException', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = createContext();
      expect(() => {
        guard.handleRequest(null, null, null, ctx);
      }).toThrow(UnauthorizedException);
      expect(() => {
        guard.handleRequest(null, null, null, ctx);
      }).toThrow('인증되지 않은 사용자입니다.');
    });

    it('optionalAuth 아니고 user가 있으면 user 반환', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const ctx = createContext();
      const user = { id: 'u1' };
      const result: unknown = guard.handleRequest(null, user, null, ctx);
      expect(result).toBe(user);
    });
  });
});
