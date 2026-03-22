import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createE2EApp } from './e2e/app.e2e.factory';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('GET /health returns health status (200 ok or 503 unhealthy)', async () => {
    const res = await request(app.getHttpServer() as Server).get('/health');
    // 200: 정상, 503: 메모리/디스크 임계치 초과
    // Windows: disk check(path:'/') 예외로 500 발생 가능 → 해당 환경에서만 허용
    const allowedStatuses =
      process.platform === 'win32' ? [200, 503, 500] : [200, 503];
    expect(allowedStatuses).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('status', 'ok');
    }
  });
});
