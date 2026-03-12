import { UsersService } from '@/users/users.service';
import { DatabaseService } from '@/database/database.service';
import type { UserByIdResult } from '@/common/database/db.types';

describe('UsersService', () => {
  let service: UsersService;
  let mockDb: {
    findUserById: jest.Mock;
    getSupabase: jest.Mock;
  };

  const mockUser: NonNullable<UserByIdResult> = {
    id: 'u1',
    nickname: 'test-user',
    role: 'USER',
    balance: 10000,
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockDb = {
      findUserById: jest.fn(),
      getSupabase: jest.fn(),
    };
    service = new UsersService(mockDb as unknown as DatabaseService);
  });

  describe('findById', () => {
    it('유저가 있으면 반환한다', async () => {
      mockDb.findUserById.mockResolvedValue(mockUser);

      const result = await service.findById('u1');

      expect(result).toEqual(mockUser);
      expect(mockDb.findUserById).toHaveBeenCalledWith('u1');
    });

    it('유저가 없으면 null 반환', async () => {
      mockDb.findUserById.mockResolvedValue(null);

      const result = await service.findById('u1');

      expect(result).toBeNull();
    });
  });

  describe('getMeWithStats', () => {
    it('유저가 없으면 null 반환', async () => {
      mockDb.findUserById.mockResolvedValue(null);

      const result = await service.getMeWithStats('u1');

      expect(result).toBeNull();
      expect(mockDb.getSupabase).not.toHaveBeenCalled();
    });

    it('유저가 있으면 stats와 함께 반환한다', async () => {
      mockDb.findUserById.mockResolvedValue(mockUser);

      const fromMock = jest.fn((table: string) => {
        const counts: Record<string, number> = {
          Bid: 3,
          Order: 2,
          Auction: 1,
        };
        const count = counts[table] ?? 0;
        return {
          select: jest.fn().mockReturnValue(
            table === 'Bid'
              ? {
                  eq: jest
                    .fn()
                    .mockResolvedValue({ data: [], error: null, count }),
                }
              : {
                  eq: jest.fn().mockReturnValue({
                    eq: jest
                      .fn()
                      .mockResolvedValue({ data: [], error: null, count }),
                  }),
                },
          ),
        };
      });

      mockDb.getSupabase.mockReturnValue({ from: fromMock });

      const result = await service.getMeWithStats('u1');

      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        ...mockUser,
        stats: { bidCount: 3, wonCount: 2, soldCount: 1 },
      });
    });

    it('Bid count 에러 시 InternalServerErrorException', async () => {
      mockDb.findUserById.mockResolvedValue(mockUser);

      const fromMock = jest.fn((table: string) => {
        if (table === 'Bid') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                data: null,
                error: new Error('DB error'),
                count: null,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest
                .fn()
                .mockResolvedValue({ data: [], error: null, count: 0 }),
            }),
          }),
        };
      });

      mockDb.getSupabase.mockReturnValue({ from: fromMock });

      await expect(service.getMeWithStats('u1')).rejects.toThrow(
        'Failed to fetch bid count',
      );
    });

    it('Order count 에러 시 InternalServerErrorException', async () => {
      mockDb.findUserById.mockResolvedValue(mockUser);

      const fromMock = jest.fn((table: string) => {
        if (table === 'Order') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('DB error'),
                  count: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq:
              table === 'Bid'
                ? jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  })
                : jest.fn().mockReturnValue({
                    eq: jest
                      .fn()
                      .mockResolvedValue({ data: [], error: null, count: 0 }),
                  }),
          }),
        };
      });

      mockDb.getSupabase.mockReturnValue({ from: fromMock });

      await expect(service.getMeWithStats('u1')).rejects.toThrow(
        'Failed to fetch order count',
      );
    });

    it('Auction count 에러 시 InternalServerErrorException', async () => {
      mockDb.findUserById.mockResolvedValue(mockUser);

      const fromMock = jest.fn((table: string) => {
        if (table === 'Auction') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: null,
                  error: new Error('DB error'),
                  count: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq:
              table === 'Bid'
                ? jest.fn().mockResolvedValue({
                    data: [],
                    error: null,
                    count: 0,
                  })
                : jest.fn().mockReturnValue({
                    eq: jest
                      .fn()
                      .mockResolvedValue({ data: [], error: null, count: 0 }),
                  }),
          }),
        };
      });

      mockDb.getSupabase.mockReturnValue({ from: fromMock });

      await expect(service.getMeWithStats('u1')).rejects.toThrow(
        'Failed to fetch auction count',
      );
    });
  });
});
