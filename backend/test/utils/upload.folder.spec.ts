import fs from 'fs';
import { getOrCreateUploadDir } from '../../src/common/util/upload.folder';

jest.mock('fs');

describe('upload.folder', () => {
  const mockMkdirSync = fs.mkdirSync as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateUploadDir', () => {
    it('should use "uploads" as default folder name', () => {
      const result = getOrCreateUploadDir();
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );
      expect(result).toContain('uploads');
    });

    it('should create folder with given name', () => {
      const result = getOrCreateUploadDir('custom-uploads');
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('custom-uploads'),
        { recursive: true },
      );
      expect(result).toContain('custom-uploads');
    });

    it('should use basename only (strip parent path)', () => {
      getOrCreateUploadDir('/some/path/uploads');
      const calls = mockMkdirSync.mock.calls as [
        string,
        { recursive: boolean },
      ][];
      const callArg = calls[0][0];
      expect(callArg).toContain('uploads');
      expect(callArg).not.toContain('/some/path');
    });

    it('should fallback to "uploads" when basename is ".."', () => {
      const result = getOrCreateUploadDir('..');
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );
      expect(result).toContain('uploads');
    });

    it('should fallback to "uploads" when basename is "."', () => {
      const result = getOrCreateUploadDir('.');
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );
      expect(result).toContain('uploads');
    });

    it('should return full path joined with cwd', () => {
      const result = getOrCreateUploadDir('uploads');
      expect(result).toMatch(/[\\/]uploads$/);
    });
  });
});
