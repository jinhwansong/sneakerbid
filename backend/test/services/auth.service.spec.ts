import type { Request, Response } from 'express';
import { AuthService } from '../../src/auth/auth.service';
import { DatabaseService } from '../../src/database/database.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../src/redis/redis.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let mockDb: {
    getSupabase: jest.Mock;
    findUserById: jest.Mock;
    transaction: jest.Mock;
  };
  let mockConfig: { get: jest.Mock };
  let mockRedis: {
    setRefreshToken: jest.Mock;
    getUserIdByRefreshToken: jest.Mock;
    revokeRefreshToken: jest.Mock;
  };
  let mockJwt: { sign: jest.Mock };

  beforeEach(() => {
    mockDb = {
      getSupabase: jest.fn(),
      findUserById: jest.fn(),
      transaction: jest.fn(),
    };
    mockConfig = { get: jest.fn() };
    mockRedis = {
      setRefreshToken: jest.fn().mockResolvedValue(undefined),
      getUserIdByRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    };
    mockJwt = { sign: jest.fn().mockReturnValue('token') };
    service = new AuthService(
      mockDb as unknown as DatabaseService,
      mockConfig as unknown as ConfigService,
      mockRedis as unknown as RedisService,
      mockJwt as unknown as JwtService,
    );
  });

  describe('login', () => {
    it('accessToken, refreshToken 반환', async () => {
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login({ id: 'u1', role: 'USER' });

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockRedis.setRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
        'u1',
        expect.any(Number),
      );
    });

    it('Redis setRefreshToken 실패 시 에러', async () => {
      mockRedis.setRefreshToken.mockRejectedValue(new Error('Redis error'));

      await expect(service.login({ id: 'u1', role: 'USER' })).rejects.toThrow(
        'Failed to persist refresh token',
      );
    });
  });

  describe('handleRefresh', () => {
    it('리프레시 토큰 없으면 401', async () => {
      const req = { cookies: {} } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn().mockReturnThis();
      const res = { status: statusMock, json: jsonMock } as unknown as Response;

      await service.handleRefresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: '리프레시 토큰이 필요합니다.',
      });
    });

    it('유효한 리프레시 토큰이면 200', async () => {
      mockRedis.getUserIdByRefreshToken.mockResolvedValue('u1');
      mockDb.findUserById.mockResolvedValue({
        id: 'u1',
        nickname: 'user',
        role: 'USER',
      });
      const req = {
        cookies: { refreshToken: 'valid-token' },
      } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn().mockReturnThis();
      const res = {
        status: statusMock,
        json: jsonMock,
        cookie: jest.fn(),
      } as unknown as Response;

      await service.handleRefresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true });
    });

    it('Redis에 없으면 401', async () => {
      mockRedis.getUserIdByRefreshToken.mockResolvedValue(null);
      const req = {
        cookies: { refreshToken: 'invalid' },
      } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn().mockReturnThis();
      const res = {
        status: statusMock,
        json: jsonMock,
      } as unknown as Response;

      await service.handleRefresh(req, res);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        message: '유효하지 않거나 만료된 리프레시 토큰입니다.',
      });
    });
  });

  describe('logout', () => {
    it('쿠키 제거 후 200', async () => {
      const req = { cookies: { refreshToken: 'token' } } as unknown as Request;
      const statusMock = jest.fn().mockReturnThis();
      const jsonMock = jest.fn().mockReturnThis();
      const clearCookieMock = jest.fn();
      const res = {
        status: statusMock,
        json: jsonMock,
        clearCookie: clearCookieMock,
      } as unknown as Response;

      await service.logout(req, res);

      expect(mockRedis.revokeRefreshToken).toHaveBeenCalledWith('token');
      expect(clearCookieMock).toHaveBeenCalledWith(
        'accessToken',
        expect.any(Object),
      );
      expect(clearCookieMock).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(Object),
      );
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: '로그아웃을 성공했습니다.',
      });
    });
  });
});
