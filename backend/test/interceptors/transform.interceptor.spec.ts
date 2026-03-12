import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';

const createContext = (path: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ path, url: path }),
    }),
  }) as unknown as ExecutionContext;

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;
  let mockContext: ExecutionContext;
  let mockHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockHandler = {
      handle: jest.fn(),
    };
    mockContext = createContext('/api/test');
  });

  it('객체 데이터 -> success: true와 함께 스프레드', (done) => {
    const data = { item: 'value' };
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, item: 'value' });
      done();
    });
  });

  it('배열 데이터 -> success: true, data', (done) => {
    const data = [1, 2, 3];
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      done();
    });
  });

  it('null -> success: true, data', (done) => {
    (mockHandler.handle as jest.Mock).mockReturnValue(of(null));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('/events 경로는 그대로 반환', (done) => {
    const ctx = createContext('/events/auction/1');
    const data = { raw: true };
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(ctx, mockHandler).subscribe((result) => {
      expect(result).toEqual({ raw: true });
      done();
    });
  });

  describe('path matching edge cases', () => {
    const rawData = { raw: true };

    it('/events -> event route (raw)', (done) => {
      const ctx = createContext('/events');
      (mockHandler.handle as jest.Mock).mockReturnValue(of(rawData));
      interceptor.intercept(ctx, mockHandler).subscribe((result) => {
        expect(result).toEqual(rawData);
        done();
      });
    });

    it('/events/ -> event route (raw)', (done) => {
      const ctx = createContext('/events/');
      (mockHandler.handle as jest.Mock).mockReturnValue(of(rawData));
      interceptor.intercept(ctx, mockHandler).subscribe((result) => {
        expect(result).toEqual(rawData);
        done();
      });
    });

    it('/eventslog -> not event route (transformed)', (done) => {
      const ctx = createContext('/eventslog');
      (mockHandler.handle as jest.Mock).mockReturnValue(of(rawData));
      interceptor.intercept(ctx, mockHandler).subscribe((result) => {
        expect(result).toEqual({ success: true, ...rawData });
        done();
      });
    });

    it('/events-old -> not event route (transformed)', (done) => {
      const ctx = createContext('/events-old');
      (mockHandler.handle as jest.Mock).mockReturnValue(of(rawData));
      interceptor.intercept(ctx, mockHandler).subscribe((result) => {
        expect(result).toEqual({ success: true, ...rawData });
        done();
      });
    });
  });
});
