import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { createE2EApp } from './e2e/app.e2e.factory';

interface StatsBody {
  success: boolean;
  activeBidders: number;
  activeAuctions: number;
  volume24h: number;
  avgBidSpeedSeconds: number;
}

interface ListBody {
  success: boolean;
  items: { auctionId?: string; id?: string }[];
}

interface HistoryBody {
  success: boolean;
  items: unknown[];
}

interface MainBody {
  success: boolean;
  ongoing: unknown[];
}

interface BidsBody {
  success: boolean;
  data: unknown[];
}

describe('Auctions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2EApp();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auctions/stats (public)', () => {
    it('returns live stats', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/stats')
        .expect(200)
        .expect((res) => {
          const body = res.body as StatsBody;
          expect(body.success).toBe(true);
          expect(typeof body.activeBidders).toBe('number');
          expect(typeof body.activeAuctions).toBe('number');
          expect(typeof body.volume24h).toBe('number');
          expect(typeof body.avgBidSpeedSeconds).toBe('number');
        });
    });
  });

  describe('GET /auctions/history (public)', () => {
    it('returns trade history', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/history')
        .expect(200)
        .expect((res) => {
          const body = res.body as HistoryBody;
          expect(body).toHaveProperty('success', true);
          expect(body).toHaveProperty('items');
          expect(Array.isArray(body.items)).toBe(true);
        });
    });

    it('accepts period query', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/history?period=1m')
        .expect(200)
        .expect((res) => {
          const body = res.body as HistoryBody;
          expect(body).toHaveProperty('success', true);
          expect(body).toHaveProperty('items');
        });
    });
  });

  describe('GET /auctions/main (optional auth)', () => {
    it('returns main auctions without auth', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/main')
        .expect(200)
        .expect((res) => {
          const body = res.body as MainBody;
          expect(body).toHaveProperty('success', true);
          expect(body).toHaveProperty('ongoing');
          expect(Array.isArray(body.ongoing)).toBe(true);
        });
    });
  });

  describe('GET /auctions (optional auth)', () => {
    it('returns auction list without auth', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions')
        .expect(200)
        .expect((res) => {
          const body = res.body as ListBody;
          expect(body).toHaveProperty('success', true);
          expect(body).toHaveProperty('items');
          expect(Array.isArray(body.items)).toBe(true);
        });
    });

    it('accepts limit', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions?limit=5')
        .expect(200)
        .expect((res) => {
          const body = res.body as ListBody;
          expect(body).toHaveProperty('items');
          expect(body.items.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('GET /auctions/:id (optional auth)', () => {
    it('returns 404 for non-existent auction', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('returns auction detail when exists', async () => {
      const listRes = await request(app.getHttpServer() as Server)
        .get('/auctions?limit=1')
        .expect(200);
      const body = listRes.body as ListBody;
      const items = body.items;
      if (items.length === 0) return;
      const id = items[0].auctionId ?? items[0].id;
      await request(app.getHttpServer() as Server)
        .get(`/auctions/${id}`)
        .expect(200)
        .expect((res) => {
          const detailBody = res.body as { success: boolean; id: string };
          expect(detailBody).toHaveProperty('success', true);
          expect(detailBody).toHaveProperty('id', id);
        });
    });
  });

  describe('GET /auctions/:id/bids (public)', () => {
    it('returns empty bids for non-existent auction', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/00000000-0000-0000-0000-000000000000/bids')
        .expect(200)
        .expect((res) => {
          const body = res.body as BidsBody;
          expect(body).toHaveProperty('success', true);
          expect(body.data).toEqual([]);
        });
    });

    it('returns bids when auction exists', async () => {
      const listRes = await request(app.getHttpServer() as Server)
        .get('/auctions?limit=1')
        .expect(200);
      const listBody = listRes.body as ListBody;
      const items = listBody.items;
      if (items.length === 0) return;
      const id = items[0].auctionId ?? items[0].id;
      await request(app.getHttpServer() as Server)
        .get(`/auctions/${id}/bids`)
        .expect(200)
        .expect((res) => {
          const bidsBody = res.body as BidsBody;
          expect(bidsBody).toHaveProperty('success', true);
          expect(bidsBody).toHaveProperty('data');
          expect(Array.isArray(bidsBody.data)).toBe(true);
        });
    });
  });

  describe('Protected routes without auth', () => {
    it('GET /auctions/me/selling returns 401', () => {
      return request(app.getHttpServer() as Server)
        .get('/auctions/me/selling')
        .expect(401);
    });

    it('POST /auctions returns 401', () => {
      return request(app.getHttpServer() as Server)
        .post('/auctions')
        .send({
          modelName: 'Test',
          brand: 'Nike',
          color: 'Black',
          description: 'Test',
          imageUrl: 'https://example.com/img.jpg',
          size: '260',
          startPrice: 10000,
          minimumIncrement: 1000,
          endTime: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(401);
    });
  });
});
