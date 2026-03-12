import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadService } from '../../src/upload/upload.service';

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('UploadService', () => {
  let service: UploadService;
  let mockConfig: { get: jest.Mock };

  beforeEach(() => {
    mockConfig = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
        const map: Record<string, unknown> = {
          NODE_ENV: 'test',
          SUPABASE_URL: 'https://test.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'test-key',
          PORT: 3000,
          HOST: 'localhost',
        };
        return map[key] ?? defaultValue;
      }),
    };
    service = new UploadService(mockConfig as unknown as ConfigService);
  });

  describe('verifyOwnershipOrTemp', () => {
    it('temp/{userId}/ 경로면 true', () => {
      const url = 'http://localhost:3000/upload/temp/u1/abc.jpg';
      expect(service.verifyOwnershipOrTemp(url, 'u1')).toBe(true);
    });

    it('다른 userId면 false', () => {
      const url = 'http://localhost:3000/upload/temp/u1/abc.jpg';
      expect(service.verifyOwnershipOrTemp(url, 'u2')).toBe(false);
    });

    it('upload prefix 없으면 false', () => {
      const url = 'http://localhost:3000/other/temp/u1/abc.jpg';
      expect(service.verifyOwnershipOrTemp(url, 'u1')).toBe(false);
    });

    it('빈 url이면 false', () => {
      expect(service.verifyOwnershipOrTemp('', 'u1')).toBe(false);
    });

    it('빈 userId면 false', () => {
      const url = 'http://localhost:3000/upload/temp/u1/abc.jpg';
      expect(service.verifyOwnershipOrTemp(url, '')).toBe(false);
    });
  });

  describe('uploadImage', () => {
    it('파일 없으면 BadRequestException', async () => {
      await expect(service.uploadImage(undefined, 'u1')).rejects.toThrow(
        '이미지 파일이 필요합니다.',
      );
    });
  });

  describe('deleteImage', () => {
    it('소유권 없으면 ForbiddenException', async () => {
      const url = 'http://localhost:3000/upload/temp/u2/abc.jpg';
      await expect(service.deleteImage(url, 'u1')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteImage(url, 'u1')).rejects.toThrow(
        '해당 이미지를 삭제할 권한이 없습니다.',
      );
    });
  });
});
