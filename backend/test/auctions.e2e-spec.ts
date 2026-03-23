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
  let firstAuctionId: string | null = null;

  beforeAll(async () => {
    app = await createE2EApp();
    try {
      const listRes = await request(app.getHttpServer() as Server).get(
        '/auctions?limit=1',
      );
      if (listRes.status === 200) {
        const body = listRes.body as ListBody;
        if (body.items.length > 0) {
          firstAuctionId = body.items[0].auctionId ?? body.items[0].id ?? null;
        }
      }
    } catch {
      // DB 연결 실패 등 시 firstAuctionId = null 유지, 나머지 테스트는 각자 실행
    }
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
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

    (firstAuctionId ? it : it.skip)(
      'returns auction detail when exists',
      async () => {
        await request(app.getHttpServer() as Server)
          .get(`/auctions/${firstAuctionId}`)
          .expect(200)
          .expect((res) => {
            const detailBody = res.body as { success: boolean; id: string };
            expect(detailBody).toHaveProperty('success', true);
            expect(detailBody).toHaveProperty('id', firstAuctionId);
          });
      },
    );
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

    (firstAuctionId ? it : it.skip)(
      'returns bids when auction exists',
      async () => {
        await request(app.getHttpServer() as Server)
          .get(`/auctions/${firstAuctionId}/bids`)
          .expect(200)
          .expect((res) => {
            const bidsBody = res.body as BidsBody;
            expect(bidsBody).toHaveProperty('success', true);
            expect(bidsBody).toHaveProperty('data');
            expect(Array.isArray(bidsBody.data)).toBe(true);
          });
      },
    );
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
