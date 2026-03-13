import { DatabaseService } from '../../src/database/database.service';
import { ConfigService } from '@nestjs/config';

const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
const mockPoolEnd = jest.fn().mockResolvedValue(undefined);
const mockConnect = jest.fn().mockResolvedValue({
  query: mockQuery,
  release: jest.fn(),
});

jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: mockConnect,
    end: mockPoolEnd,
  })),
}));

const mockSingle = jest.fn();
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
const mockSupabase = { from: mockFrom };

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockConfig: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
        if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'test-key';
        if (key === 'DATABASE_URL') return 'postgresql://localhost:5432/test';
        return undefined;
      }),
    };
    service = new DatabaseService(mockConfig as unknown as ConfigService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('constructor', () => {
    it('필수 env 없으면 에러', () => {
      const emptyConfig = { get: jest.fn().mockReturnValue(undefined) };
      expect(
        () => new DatabaseService(emptyConfig as unknown as ConfigService),
      ).toThrow('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    });

    it('DATABASE_URL 없으면 에러', () => {
      const noDbConfig = {
        get: jest.fn((key: string) => {
          if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
          if (key === 'SUPABASE_SERVICE_ROLE_KEY') return 'key';
          return undefined;
        }),
      };
      expect(
        () => new DatabaseService(noDbConfig as unknown as ConfigService),
      ).toThrow('DATABASE_URL');
    });
  });

  describe('getSupabase', () => {
    it('supabase 클라이언트 반환', () => {
      const client = service.getSupabase();
      expect(client).toBe(mockSupabase);
    });
  });

  describe('findUserById', () => {
    it('유저가 있으면 변환하여 반환', async () => {
      const userData = {
        id: 'u1',
        nickname: 'test',
        role: 'USER',
        balance: 10000,
        profileImageUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      };
      mockSingle.mockResolvedValueOnce({ data: userData, error: null });

      const result = await service.findUserById('u1');

      expect(mockFrom).toHaveBeenCalledWith('User');
      expect(mockSelect).toHaveBeenCalledWith(
        'id, nickname, role, balance, profileImageUrl, createdAt, updatedAt',
      );
      expect(mockEq).toHaveBeenCalledWith('id', 'u1');
      expect(result).toEqual({
        id: 'u1',
        nickname: 'test',
        role: 'USER',
        balance: 10000,
        profileImageUrl: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('유저가 없으면 null', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await service.findUserById('missing');

      expect(result).toBeNull();
    });

    it('에러 시 throw', async () => {
      const err = new Error('DB error');
      mockSingle.mockResolvedValueOnce({ data: null, error: err });

      await expect(service.findUserById('u1')).rejects.toThrow(err);
    });
  });

  describe('query', () => {
    it('SQL 실행 후 rows 반환', async () => {
      const rows = [{ id: '1', name: 'a' }];
      mockQuery.mockResolvedValueOnce({ rows });

      const result = await service.query<{ id: string; name: string }>(
        'SELECT * FROM t',
        [],
      );

      expect(mockConnect).toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM t', []);
      expect(result).toEqual(rows);
    });

    it('values 없으면 빈 배열 전달', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await service.query('SELECT 1');

      expect(mockQuery).toHaveBeenCalledWith('SELECT 1', []);
    });
  });

  describe('transaction', () => {
    it('fn 실행 후 COMMIT', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined) // COMMIT
        .mockResolvedValueOnce({ rows: [] }); // fn 내부 query (있다면)

      const fn = jest.fn().mockResolvedValue('result');
      const result = await service.transaction(fn);

      expect(mockQuery).toHaveBeenCalledWith('BEGIN');
      expect(mockQuery).toHaveBeenCalledWith('COMMIT');
      expect(fn).toHaveBeenCalled();
      expect(result).toBe('result');
    });

    it('fn 에러 시 ROLLBACK', async () => {
      mockQuery
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const fn = jest.fn().mockRejectedValue(new Error('tx error'));

      await expect(service.transaction(fn)).rejects.toThrow('tx error');
      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('onModuleDestroy', () => {
    it('pool.end 호출', async () => {
      await service.onModuleDestroy();
      expect(mockPoolEnd).toHaveBeenCalled();
    });
  });
});
