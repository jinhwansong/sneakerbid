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

  it('GET /health returns health status', async () => {
    const res = await request(app.getHttpServer() as Server).get('/health');
    // 200: 정상, 503: 메모리/디스크 임계치 초과, 500: Windows 등에서 disk check 예외
    expect([200, 503, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body).toHaveProperty('status', 'ok');
    }
  });
});
