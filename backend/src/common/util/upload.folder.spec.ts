import fs from 'fs';
import { getOrCreateUploadDir } from './upload.folder';

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
      expect(mockMkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads'),
        { recursive: true },
      );
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

    it('should call mkdirSync with recursive: true', () => {
      getOrCreateUploadDir();
      expect(mockMkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
    });

    it('should return full path joined with cwd', () => {
      const result = getOrCreateUploadDir('uploads');
      expect(result).toMatch(/[\\/]uploads$/);
    });
  });
});
