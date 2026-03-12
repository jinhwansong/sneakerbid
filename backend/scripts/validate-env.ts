/**
 * 환경변수 검증 스크립트
 * CI/배포 전 실행하여 필수 env가 설정되었는지 확인
 * 사용: npm run env:validate (backend 디렉토리에서)
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { validate } from '../src/common/config/env.validation';

const envPaths = [
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'backend', '.env'),
];

for (const p of envPaths) {
  dotenv.config({ path: p });
}

const config = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: process.env.PORT ?? '3000',
  APP_NAME: process.env.APP_NAME,
  APP_VERSION: process.env.APP_VERSION ?? '1.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  FRONTEND_URL: process.env.FRONTEND_URL,
  THROTTLE_TTL: process.env.THROTTLE_TTL,
  THROTTLE_LIMIT: process.env.THROTTLE_LIMIT,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  REDIS_URL: process.env.REDIS_URL,
};

try {
  validate(config);
  console.log('✓ 환경변수 검증 완료');
  process.exit(0);
} catch (err) {
  console.error('✗ 환경변수 검증 실패:', err instanceof Error ? err.message : err);
  process.exit(1);
}
