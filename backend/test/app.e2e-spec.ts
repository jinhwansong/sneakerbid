import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createE2EApp } from './e2e/app.e2e.factory';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer() as Server)
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          success: true,
          data: 'Hello World!',
        });
      });
  });
});
