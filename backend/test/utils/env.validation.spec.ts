import { validate } from '@/common/config/env.validation';

describe('env.validation', () => {
  const validBaseConfig = {
    NODE_ENV: 'development',
    PORT: '3000',
    APP_NAME: 'test-app',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_PRIVATE_KEY:
      '-----BEGIN TEST PRIVATE KEY-----\ntest\n-----END TEST PRIVATE KEY-----',
    JWT_PUBLIC_KEY:
      '-----BEGIN TEST PUBLIC KEY-----\ntest\n-----END TEST PUBLIC KEY-----',
    THROTTLE_TTL: '60',
    THROTTLE_LIMIT: '100',
  };

  describe('validate', () => {
    it('valid config should pass', () => {
      const result = validate({ ...validBaseConfig });
      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(3000);
      expect(result.APP_NAME).toBe('test-app');
    });

    it('should use CORS_ORIGIN from config when provided', () => {
      const result = validate({
        ...validBaseConfig,
        CORS_ORIGIN: 'https://example.com',
      });
      expect(result.CORS_ORIGIN).toBe('https://example.com');
    });

    it('should use FRONTEND_URL as CORS_ORIGIN fallback when CORS_ORIGIN is missing', () => {
      const result = validate({
        ...validBaseConfig,
        FRONTEND_URL: 'https://frontend.com',
      });
      expect(result.CORS_ORIGIN).toBe('https://frontend.com');
    });

    it('should throw when invalid NODE_ENV', () => {
      expect(() =>
        validate({
          ...validBaseConfig,
          NODE_ENV: 'invalid',
        }),
      ).toThrow();
    });

    it('should throw when PORT is out of range', () => {
      expect(() =>
        validate({
          ...validBaseConfig,
          PORT: '0',
        }),
      ).toThrow();

      expect(() =>
        validate({
          ...validBaseConfig,
          PORT: '70000',
        }),
      ).toThrow();
    });

    it('should throw when required string is empty', () => {
      expect(() =>
        validate({
          ...validBaseConfig,
          SUPABASE_URL: '',
        }),
      ).toThrow();
    });

    it('should throw when THROTTLE_TTL is invalid', () => {
      expect(() =>
        validate({
          ...validBaseConfig,
          THROTTLE_TTL: '0',
        }),
      ).toThrow();
    });

    it('should throw when THROTTLE_LIMIT is invalid', () => {
      expect(() =>
        validate({
          ...validBaseConfig,
          THROTTLE_LIMIT: '0',
        }),
      ).toThrow();
    });

    it('should accept test environment', () => {
      const result = validate({
        ...validBaseConfig,
        NODE_ENV: 'test',
      });
      expect(result.NODE_ENV).toBe('test');
    });

    it('should accept production environment', () => {
      const result = validate({
        ...validBaseConfig,
        NODE_ENV: 'production',
      });
      expect(result.NODE_ENV).toBe('production');
    });
  });
});
